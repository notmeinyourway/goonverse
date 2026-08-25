import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HashingService } from '../common/services/hashing.service';
import { StorageService } from '../storage/storage.service';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingService: HashingService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Retrieve currently authenticated user profile
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deleted_at: null },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        age_verified: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            people: { where: { deleted_at: null } },
            images: { where: { deleted_at: null } },
            activities: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      ageVerified: user.age_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      counts: {
        people: user._count.people,
        images: user._count.images,
        activities: user._count.activities,
      },
    };
  }

  /**
   * Update profile details (e.g. username)
   */
  async updateMe(userId: string, dto: UpdateUserDto) {
    if (dto.username) {
      const normalizedUsername = dto.username.toLowerCase().trim();
      const existing = await this.prisma.user.findFirst({
        where: {
          username: normalizedUsername,
          id: { not: userId },
        },
      });

      if (existing) {
        throw new ConflictException('This username is already taken');
      }

      return this.prisma.user.update({
        where: { id: userId },
        data: { username: normalizedUsername },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          age_verified: true,
          updated_at: true,
        },
      });
    }

    return this.getMe(userId);
  }

  /**
   * Change user password with current password verification
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deleted_at: null },
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    const isValid = await this.hashingService.verifyPassword(
      user.password_hash,
      dto.currentPassword,
    );

    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await this.hashingService.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: newHash },
    });

    // Revoke all refresh tokens on password change for security
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });

    this.logger.log(`Password changed and sessions revoked for user: ${userId}`);

    return { success: true, message: 'Password updated successfully' };
  }

  /**
   * Export all authenticated user-owned metadata (GDPR / privacy compliance)
   */
  async exportUserData(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deleted_at: null },
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    const [people, images, activities, tags] = await Promise.all([
      this.prisma.person.findMany({
        where: { user_id: userId, deleted_at: null },
        select: { id: true, name: true, notes: true, created_at: true },
      }),
      this.prisma.image.findMany({
        where: { user_id: userId, deleted_at: null },
        select: {
          id: true,
          person_id: true,
          original_filename: true,
          mime_type: true,
          file_size: true,
          created_at: true,
        },
      }),
      this.prisma.activity.findMany({
        where: { user_id: userId },
        orderBy: { occurred_at: 'desc' },
        select: {
          id: true,
          person_id: true,
          image_id: true,
          occurred_at: true,
          notes: true,
          created_at: true,
        },
      }),
      this.prisma.tag.findMany({
        where: { user_id: userId },
        select: { id: true, name: true },
      }),
    ]);

    return {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        app: 'Goonverse Vault',
      },
      profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        ageVerified: user.age_verified,
        createdAt: user.created_at,
      },
      people,
      images,
      activities,
      tags,
    };
  }

  /**
   * Delete user account: deletes B2 storage objects, soft-deletes database entities, and revokes sessions
   */
  async deleteMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deleted_at: null },
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    // Find all images belonging to the user to clean up from Backblaze B2
    const userImages = await this.prisma.image.findMany({
      where: { user_id: userId },
      select: { id: true, storage_key: true },
    });

    // Delete physical storage objects
    for (const img of userImages) {
      try {
        await this.storageService.deleteObject(img.storage_key);
      } catch (err: any) {
        this.logger.warn(`Failed to delete B2 object ${img.storage_key}: ${err.message}`);
      }
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { deleted_at: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: { user_id: userId, revoked_at: null },
        data: { revoked_at: now },
      }),
      this.prisma.person.updateMany({
        where: { user_id: userId, deleted_at: null },
        data: { deleted_at: now },
      }),
      this.prisma.image.updateMany({
        where: { user_id: userId, deleted_at: null },
        data: { deleted_at: now },
      }),
    ]);

    this.logger.log(`User account and B2 media fully deleted for user: ${userId}`);

    return { success: true, message: 'Account and associated vault data deleted successfully' };
  }
}
