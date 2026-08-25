import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAdminActivitiesDto } from '../dto/admin-activities.dto';

@Injectable()
export class AdminActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async listActivities(dto: QueryAdminActivitiesDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dto.userId) {
      where.user_id = dto.userId;
    }

    if (dto.personId) {
      where.person_id = dto.personId;
    }

    if (dto.imageId) {
      where.image_id = dto.imageId;
    }

    if (dto.startDate || dto.endDate) {
      where.occurred_at = {};
      if (dto.startDate) where.occurred_at.gte = new Date(dto.startDate);
      if (dto.endDate) where.occurred_at.lte = new Date(dto.endDate);
    }

    const [total, activities] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurred_at: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
          person: {
            select: { id: true, name: true },
          },
          image: {
            select: { id: true, original_filename: true, mime_type: true },
          },
        },
      }),
    ]);

    return {
      data: activities.map((act) => ({
        id: act.id,
        userId: act.user_id,
        username: act.user?.username || 'Unknown',
        personId: act.person_id,
        personName: act.person?.name || null,
        imageId: act.image_id,
        imageFilename: act.image?.original_filename || null,
        occurredAt: act.occurred_at,
        notes: act.notes,
        createdAt: act.created_at,
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
