import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { generateImageStorageKey } from '../storage/storage.interface';
import { UploadImageDto, QueryImagesDto } from './dto/image.dto';
import { randomUUID } from 'crypto';

import { validateImageSignature } from '../common/security/file-signature.validator';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload an image to private storage and record safe metadata in database
   */
  async upload(
    userId: string,
    file: Express.Multer.File,
    dto: UploadImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Validate binary file signature (magic bytes)
    validateImageSignature(file.buffer, file.mimetype);

    // Validate person ownership if personId is supplied
    let personId: string | null = null;
    if (dto.personId) {
      const person = await this.prisma.person.findFirst({
        where: {
          id: dto.personId,
          user_id: userId,
          deleted_at: null,
        },
      });

      if (!person) {
        throw new BadRequestException('The specified person does not exist or does not belong to you');
      }
      personId = person.id;
    }

    const imageId = randomUUID();
    const storageKey = generateImageStorageKey(
      userId,
      personId || 'unassigned',
      imageId,
      'original',
    );

    // Upload to private object storage
    await this.storageService.uploadObject(storageKey, file.buffer, file.mimetype, {
      userId,
      originalFilename: encodeURIComponent(file.originalname),
    });

    // Parse and handle tags
    const tagNames = dto.tags
      ? dto.tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0)
      : [];

    // Save image metadata in PostgreSQL
    const image = await this.prisma.$transaction(async (tx) => {
      const newImage = await tx.image.create({
        data: {
          id: imageId,
          user_id: userId,
          person_id: personId,
          storage_key: storageKey,
          original_filename: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
        },
      });

      // Upsert tags and link
      for (const tagName of tagNames) {
        const tag = await tx.tag.upsert({
          where: {
            user_id_name: {
              user_id: userId,
              name: tagName,
            },
          },
          update: {},
          create: {
            user_id: userId,
            name: tagName,
          },
        });

        await tx.imageTag.create({
          data: {
            image_id: newImage.id,
            tag_id: tag.id,
          },
        });
      }

      return newImage;
    });

    this.logger.log(`Uploaded image ${image.id} for user ${userId}`);

    return {
      id: image.id,
      person_id: image.person_id,
      original_filename: image.original_filename,
      mime_type: image.mime_type,
      file_size: image.file_size,
      created_at: image.created_at,
      tags: tagNames,
    };
  }

  /**
   * Find paginated list of user images
   */
  async findAll(userId: string, query: QueryImagesDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      user_id: userId,
      deleted_at: null,
    };

    if (query.personId) {
      whereClause.person_id = query.personId;
    }

    const [total, images] = await Promise.all([
      this.prisma.image.count({ where: whereClause }),
      this.prisma.image.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          person_id: true,
          original_filename: true,
          mime_type: true,
          file_size: true,
          created_at: true,
          image_tags: {
            select: {
              tag: {
                select: { name: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: images.map((img) => ({
        id: img.id,
        person_id: img.person_id,
        original_filename: img.original_filename,
        mime_type: img.mime_type,
        file_size: img.file_size,
        created_at: img.created_at,
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

  /**
   * Get image signed download URL with strict ownership check
   */
  async getImageAccess(userId: string, imageId: string, expiresInSeconds = 900) {
    const image = await this.prisma.image.findFirst({
      where: {
        id: imageId,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Generate short-lived signed URL
    const signedUrl = await this.storageService.createSignedDownloadUrl(
      image.storage_key,
      expiresInSeconds,
    );

    return {
      id: image.id,
      original_filename: image.original_filename,
      mime_type: image.mime_type,
      file_size: image.file_size,
      url: signedUrl,
      expiresIn: expiresInSeconds,
    };
  }

  /**
   * Delete image from storage and soft-delete from database
   */
  async remove(userId: string, imageId: string) {
    const image = await this.prisma.image.findFirst({
      where: {
        id: imageId,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Delete from S3/B2 storage
    try {
      await this.storageService.deleteObject(image.storage_key);
    } catch (err) {
      this.logger.warn(
        `Failed to delete storage object ${image.storage_key}: ${(err as Error).message}. Proceeding with DB record soft delete.`,
      );
    }

    // Soft-delete database record
    await this.prisma.image.update({
      where: { id: imageId },
      data: { deleted_at: new Date() },
    });

    this.logger.log(`Deleted image ${imageId} for user ${userId}`);

    return { success: true, message: 'Image deleted successfully' };
  }
}
