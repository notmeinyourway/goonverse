import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAdminAuditLogsDto } from '../dto/admin-audit.dto';

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record an immutable audit log entry for a privileged operation
   */
  async log(params: {
    adminUserId: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const logEntry = await this.prisma.adminAuditLog.create({
        data: {
          admin_user_id: params.adminUserId,
          action: params.action,
          target_type: params.targetType,
          target_id: params.targetId || null,
          metadata: params.metadata || {},
        },
      });
      this.logger.log(
        `[AUDIT] Admin ${params.adminUserId} executed ${params.action} on ${params.targetType} ${params.targetId || ''}`,
      );
      return logEntry;
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`, error.stack);
      // Non-blocking for business ops, but logged with urgency
    }
  }

  /**
   * Paginated retrieval of audit logs
   */
  async queryLogs(dto: QueryAdminAuditLogsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (dto.adminUserId) where.admin_user_id = dto.adminUserId;
    if (dto.action) where.action = dto.action;
    if (dto.targetType) where.target_type = dto.targetType;
    if (dto.targetId) where.target_id = dto.targetId;

    const [total, items] = await Promise.all([
      this.prisma.adminAuditLog.count({ where }),
      this.prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      data: items.map((item) => ({
        id: item.id,
        adminUserId: item.admin_user_id,
        adminUsername: item.admin?.username || 'Unknown',
        adminEmail: item.admin?.email || '',
        adminRole: item.admin?.role || 'MODERATOR',
        action: item.action,
        targetType: item.target_type,
        targetId: item.target_id,
        metadata: item.metadata,
        createdAt: item.created_at,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
