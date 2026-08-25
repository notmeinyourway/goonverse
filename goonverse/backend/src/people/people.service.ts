import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto, UpdatePersonDto, QueryPeopleDto } from './dto/person.dto';

@Injectable()
export class PeopleService {
  private readonly logger = new Logger(PeopleService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new private Person entry
   */
  async create(userId: string, dto: CreatePersonDto) {
    return this.prisma.person.create({
      data: {
        user_id: userId,
        name: dto.name.trim(),
        notes: dto.notes?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        notes: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  /**
   * Find paginated list of people belonging strictly to the authenticated user
   */
  async findAll(userId: string, query: QueryPeopleDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      user_id: userId,
      deleted_at: null,
    };

    if (query.q && query.q.trim().length > 0) {
      whereClause.name = {
        contains: query.q.trim(),
        mode: 'insensitive',
      };
    }

    const [total, people] = await Promise.all([
      this.prisma.person.count({ where: whereClause }),
      this.prisma.person.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          name: true,
          notes: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              images: { where: { deleted_at: null } },
              activities: true,
            },
          },
        },
      }),
    ]);

    return {
      data: people.map((p) => ({
        id: p.id,
        name: p.name,
        notes: p.notes,
        created_at: p.created_at,
        updated_at: p.updated_at,
        imageCount: p._count.images,
        activityCount: p._count.activities,
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
   * Find a single person by ID with strict ownership validation
   */
  async findOne(userId: string, personId: string) {
    const person = await this.prisma.person.findFirst({
      where: {
        id: personId,
        user_id: userId,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        notes: true,
        created_at: true,
        updated_at: true,
        images: {
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
        _count: {
          select: {
            images: { where: { deleted_at: null } },
            activities: true,
          },
        },
      },
    });

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    return {
      id: person.id,
      name: person.name,
      notes: person.notes,
      created_at: person.created_at,
      updated_at: person.updated_at,
      imageCount: person._count.images,
      activityCount: person._count.activities,
      images: person.images,
    };
  }

  /**
   * Update person details with strict ownership verification
   */
  async update(userId: string, personId: string, dto: UpdatePersonDto) {
    // Verify person exists and belongs to user
    await this.findOne(userId, personId);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.notes !== undefined) updateData.notes = dto.notes?.trim() || null;

    return this.prisma.person.update({
      where: { id: personId },
      data: updateData,
      select: {
        id: true,
        name: true,
        notes: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  /**
   * Soft delete person and cascade soft-delete associated images
   */
  async remove(userId: string, personId: string) {
    await this.findOne(userId, personId);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.person.update({
        where: { id: personId },
        data: { deleted_at: now },
      }),
      this.prisma.image.updateMany({
        where: { person_id: personId, deleted_at: null },
        data: { deleted_at: now },
      }),
    ]);

    return { success: true, message: 'Person deleted successfully' };
  }
}
