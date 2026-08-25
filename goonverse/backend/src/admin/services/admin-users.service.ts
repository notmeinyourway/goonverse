import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { QueryAdminUsersDto, SuspendUserDto, UpdateUserRoleDto, UserStatusFilter } from '../dto/admin-users.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async listUsers(dto: QueryAdminUsersDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dto.q) {
      const query = dto.q.toLowerCase().trim();
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (dto.role) {
      where.role = dto.role;
    }

    if (dto.status === UserStatusFilter.ACTIVE) {
      where.deleted_at = null;
      where.suspended_at = null;
    } else if (dto.status === UserStatusFilter.SUSPENDED) {
      where.suspended_at = { not: null };
      where.deleted_at = null;
    } else if (dto.status === UserStatusFilter.DELETED) {
      where.deleted_at = { not: null };
    }

    const orderBy: any = {};
    const validSortColumns = ['created_at', 'updated_at', 'username', 'email'];
    const sortField = validSortColumns.includes(dto.sortBy || '') ? dto.sortBy! : 'created_at';
    orderBy[sortField] = dto.sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          age_verified: true,
          suspended_at: true,
          suspension_reason: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
          _count: {
            select: {
              people: true,
              images: { where: { deleted_at: null } },
              activities: true,
            },
          },
        },
      }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        ageVerified: u.age_verified,
        status: u.deleted_at ? 'DELETED' : u.suspended_at ? 'SUSPENDED' : 'ACTIVE',
        suspendedAt: u.suspended_at,
        suspensionReason: u.suspension_reason,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        deletedAt: u.deleted_at,
        counts: {
          people: u._count.people,
          images: u._count.images,
          activities: u._count.activities,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetail(id: string, adminUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            people: true,
            images: { where: { deleted_at: null } },
            activities: true,
          },
        },
        people: {
          take: 5,
          orderBy: { created_at: 'desc' },
          select: { id: true, name: true, created_at: true },
        },
        images: {
          take: 6,
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            original_filename: true,
            mime_type: true,
            file_size: true,
            created_at: true,
          },
        },
        activities: {
          take: 5,
          orderBy: { occurred_at: 'desc' },
          select: {
            id: true,
            occurred_at: true,
            notes: true,
            created_at: true,
            person: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Record audit event
    await this.auditService.log({
      adminUserId,
      action: 'ADMIN_VIEW_USER',
      targetType: 'USER',
      targetId: user.id,
      metadata: { username: user.username, email: user.email },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      ageVerified: user.age_verified,
      status: user.deleted_at ? 'DELETED' : user.suspended_at ? 'SUSPENDED' : 'ACTIVE',
      suspendedAt: user.suspended_at,
      suspensionReason: user.suspension_reason,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      deletedAt: user.deleted_at,
      counts: {
        people: user._count.people,
        images: user._count.images,
        activities: user._count.activities,
      },
      recentPeople: user.people,
      recentImages: user.images,
      recentActivities: user.activities,
    };
  }

  async suspendUser(id: string, dto: SuspendUserDto, adminUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot suspend a SUPER_ADMIN account');
    }

    const now = new Date();
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        suspended_at: now,
        suspension_reason: dto.reason,
      },
    });

    // Invalidate all active sessions for this user
    await this.prisma.refreshToken.updateMany({
      where: { user_id: id, revoked_at: null },
      data: { revoked_at: now },
    });

    await this.auditService.log({
      adminUserId,
      action: 'ADMIN_SUSPEND_USER',
      targetType: 'USER',
      targetId: user.id,
      metadata: { reason: dto.reason, username: user.username },
    });

    return {
      id: updated.id,
      username: updated.username,
      status: 'SUSPENDED',
      suspendedAt: updated.suspended_at,
      suspensionReason: updated.suspension_reason,
    };
  }

  async restoreUser(id: string, adminUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        suspended_at: null,
        suspension_reason: null,
      },
    });

    await this.auditService.log({
      adminUserId,
      action: 'ADMIN_RESTORE_USER',
      targetType: 'USER',
      targetId: user.id,
      metadata: { username: user.username },
    });

    return {
      id: updated.id,
      username: updated.username,
      status: 'ACTIVE',
      suspendedAt: null,
      suspensionReason: null,
    };
  }

  async updateUserRole(id: string, dto: UpdateUserRoleDto, adminUserId: string) {
    const targetUser = await this.prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const oldRole = targetUser.role;
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });

    await this.auditService.log({
      adminUserId,
      action: 'ADMIN_ROLE_CHANGE',
      targetType: 'USER',
      targetId: id,
      metadata: { previousRole: oldRole, newRole: dto.role, username: targetUser.username },
    });

    return {
      id: updated.id,
      username: updated.username,
      role: updated.role,
    };
  }
}
