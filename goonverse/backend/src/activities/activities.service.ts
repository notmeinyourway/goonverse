import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto, QueryActivitiesDto } from './dto/activity.dto';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new activity with strict multi-resource ownership and association checks
   */
  async create(userId: string, dto: CreateActivityDto) {
    let personId: string | null = null;
    let imageId: string | null = null;

    // Validate person ownership
    if (dto.personId) {
      const person = await this.prisma.person.findFirst({
        where: {
          id: dto.personId,
          user_id: userId,
          deleted_at: null,
        },
      });

      if (!person) {
        throw new BadRequestException('The selected person does not exist or does not belong to you');
      }
      personId = person.id;
    }

    // Validate image ownership
    if (dto.imageId) {
      const image = await this.prisma.image.findFirst({
        where: {
          id: dto.imageId,
          user_id: userId,
          deleted_at: null,
        },
      });

      if (!image) {
        throw new BadRequestException('The selected image does not exist or does not belong to you');
      }

      // Validate image-person consistency if both are specified
      if (personId && image.person_id && image.person_id !== personId) {
        throw new BadRequestException('The selected image is associated with a different person');
      }

      imageId = image.id;
    }

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    if (isNaN(occurredAt.getTime())) {
      throw new BadRequestException('Invalid occurredAt date');
    }

    const activity = await this.prisma.activity.create({
      data: {
        user_id: userId,
        person_id: personId,
        image_id: imageId,
        occurred_at: occurredAt,
        notes: dto.notes?.trim() || null,
      },
      include: {
        person: {
          select: { id: true, name: true },
        },
        image: {
          select: { id: true, original_filename: true, mime_type: true },
        },
      },
    });

    this.logger.log(`Created activity ${activity.id} for user ${userId}`);

    return {
      id: activity.id,
      person_id: activity.person_id,
      image_id: activity.image_id,
      occurred_at: activity.occurred_at,
      notes: activity.notes,
      created_at: activity.created_at,
      person: activity.person,
      image: activity.image,
    };
  }

  /**
   * Find paginated list of user activities with filters
   */
  async findAll(userId: string, query: QueryActivitiesDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      user_id: userId,
    };

    if (query.personId) {
      whereClause.person_id = query.personId;
    }

    if (query.imageId) {
      whereClause.image_id = query.imageId;
    }

    if (query.startDate || query.endDate) {
      whereClause.occurred_at = {};
      if (query.startDate) {
        whereClause.occurred_at.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        whereClause.occurred_at.lte = new Date(query.endDate);
      }
    }

    const [total, activities] = await Promise.all([
      this.prisma.activity.count({ where: whereClause }),
      this.prisma.activity.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { occurred_at: 'desc' },
        include: {
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
        person_id: act.person_id,
        image_id: act.image_id,
        occurred_at: act.occurred_at,
        notes: act.notes,
        created_at: act.created_at,
        person: act.person,
        image: act.image,
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
   * Find a single activity by ID with strict ownership validation
   */
  async findOne(userId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        user_id: userId,
      },
      include: {
        person: {
          select: { id: true, name: true },
        },
        image: {
          select: { id: true, original_filename: true, mime_type: true },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return {
      id: activity.id,
      person_id: activity.person_id,
      image_id: activity.image_id,
      occurred_at: activity.occurred_at,
      notes: activity.notes,
      created_at: activity.created_at,
      person: activity.person,
      image: activity.image,
    };
  }

  /**
   * Delete an activity by ID
   */
  async remove(userId: string, activityId: string) {
    await this.findOne(userId, activityId);

    await this.prisma.activity.delete({
      where: { id: activityId },
    });

    return { success: true, message: 'Activity deleted successfully' };
  }
}
