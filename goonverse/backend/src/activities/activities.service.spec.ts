import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      person: { findFirst: jest.fn() },
      image: { findFirst: jest.fn() },
      activity: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  it('should create valid activity', async () => {
    prisma.person.findFirst.mockResolvedValue({ id: 'person-1', user_id: 'user-1' });
    prisma.image.findFirst.mockResolvedValue({
      id: 'image-1',
      user_id: 'user-1',
      person_id: 'person-1',
    });

    const mockCreated = {
      id: 'act-1',
      user_id: 'user-1',
      person_id: 'person-1',
      image_id: 'image-1',
      occurred_at: new Date(),
      notes: 'Notes',
      created_at: new Date(),
      person: { id: 'person-1', name: 'Alice' },
      image: { id: 'image-1', original_filename: 'photo.jpg', mime_type: 'image/jpeg' },
    };
    prisma.activity.create.mockResolvedValue(mockCreated);

    const result = await service.create('user-1', {
      personId: 'person-1',
      imageId: 'image-1',
      notes: 'Notes',
    });

    expect(result.id).toBe('act-1');
    expect(result.person?.name).toBe('Alice');
  });

  it('should reject activity if person does not belong to user', async () => {
    prisma.person.findFirst.mockResolvedValue(null);

    await expect(
      service.create('user-1', { personId: 'person-of-user-2' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject activity if image does not belong to user', async () => {
    prisma.person.findFirst.mockResolvedValue({ id: 'person-1', user_id: 'user-1' });
    prisma.image.findFirst.mockResolvedValue(null);

    await expect(
      service.create('user-1', { personId: 'person-1', imageId: 'image-of-user-2' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject activity if image belongs to a different person', async () => {
    prisma.person.findFirst.mockResolvedValue({ id: 'person-1', user_id: 'user-1' });
    prisma.image.findFirst.mockResolvedValue({
      id: 'image-1',
      user_id: 'user-1',
      person_id: 'person-2', // Different person!
    });

    await expect(
      service.create('user-1', { personId: 'person-1', imageId: 'image-1' }),
    ).rejects.toThrow(BadRequestException);
  });
});
