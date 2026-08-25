import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { AdminAuditService } from './admin-audit.service';
import { QueryAdminImagesDto, RemoveAdminImageDto } from '../dto/admin-images.dto';

@Injectable()
export class AdminImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly auditService: AdminAuditService,
  ) {}

  async listImages(dto: QueryAdminImagesDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 24;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dto.status === 'ACTIVE') {
      where.deleted_at = null;
    } else if (dto.status === 'DELETED') {
      where.deleted_at = { not: null };
    }

    if (dto.userId) {
      where.user_id = dto.userId;
    }

    if (dto.personId) {
      where.person_id = dto.personId;
    }

    if (dto.mimeType) {
      where.mime_type = { contains: dto.mimeType, mode: 'insensitive' };
    }

    const [total, images] = await Promise.all([
      this.prisma.image.count({ where }),
      this.prisma.image.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
          person: {
            select: { id: true, name: true },
          },
          image_tags: {
            include: { tag: true },
          },
        },
      }),
    ]);

    return {
      data: images.map((img) => ({
        id: img.id,
        userId: img.user_id,
        ownerUsername: img.user?.username || 'Unknown',
        ownerEmail: img.user?.email || '',
        personId: img.person_id,
        personName: img.person?.name || null,
        originalFilename: img.original_filename,
        mimeType: img.mime_type,
        fileSize: img.file_size,
        status: img.deleted_at ? 'DELETED' : 'ACTIVE',
        deletedAt: img.deleted_at,
        createdAt: img.created_at,
        tags: img.image_tags.map((it) => it.tag.name),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminImageAccess(id: string, adminUserId: string) {
    const image = await this.prisma.image.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, email: true } },
        person: { select: { id: true, name: true } },
      },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found`);
    }

    // Generate short-lived signed access URL (15 minutes expiration)
    const signedUrl = await this.storageService.createSignedDownloadUrl(image.storage_key, 900);

    // CRITICAL: Unconditional audit event logging for admin image access
    await this.auditService.log({
      adminUserId,
      action: 'ADMIN_VIEW_IMAGE',
      targetType: 'IMAGE',
      targetId: image.id,
      metadata: {
        originalFilename: image.original_filename,
        fileSize: image.file_size,
        mimeType: image.mime_type,
        ownerUserId: image.user_id,
        ownerUsername: image.user?.username,
      },
    });

    return {
      id: image.id,
      originalFilename: image.original_filename,
      mimeType: image.mime_type,
      fileSize: image.file_size,
      url: signedUrl,
      expiresIn: 900,
      owner: {
        id: image.user.id,
        username: image.user.username,
        email: image.user.email,
      },
      person: image.person ? { id: image.person.id, name: image.person.name } : null,
      createdAt: image.created_at,
    };
  }

  async removeImage(id: string, dto: RemoveAdminImageDto, adminUserId: string) {
    const image = await this.prisma.image.findUnique({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found`);
    }

    const now = new Date();
    await this.prisma.image.update({
      where: { id },
      data: { deleted_at: now },
    });

    await this.auditService.log({
      adminUserId,
      action: 'ADMIN_DELETE_IMAGE',
      targetType: 'IMAGE',
      targetId: image.id,
      metadata: {
        reason: dto.reason,
        originalFilename: image.original_filename,
        ownerUserId: image.user_id,
      },
    });

    return {
      id: image.id,
      status: 'DELETED',
      deletedAt: now,
    };
  }
}
