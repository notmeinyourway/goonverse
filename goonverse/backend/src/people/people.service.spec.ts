import { Test, TestingModule } from '@nestjs/testing';
import { PeopleService } from './people.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PeopleService', () => {
  let service: PeopleService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      person: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      image: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeopleService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PeopleService>(PeopleService);
  });

  it('should create a person for authenticated user', async () => {
    const mockPerson = {
      id: 'person-1',
      name: 'Alice',
      notes: 'Some notes',
      created_at: new Date(),
      updated_at: new Date(),
    };
    prisma.person.create.mockResolvedValue(mockPerson);

    const result = await service.create('user-1', { name: 'Alice', notes: 'Some notes' });
    expect(result.name).toBe('Alice');
    expect(prisma.person.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ user_id: 'user-1', name: 'Alice' }),
      }),
    );
  });

  it('should list only user-owned people', async () => {
    prisma.person.count.mockResolvedValue(1);
    prisma.person.findMany.mockResolvedValue([
      {
        id: 'person-1',
        name: 'Alice',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
        _count: { images: 2, activities: 5 },
      },
    ]);

    const result = await service.findAll('user-1', { page: 1, limit: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].imageCount).toBe(2);
    expect(result.meta.total).toBe(1);
  });

  it('should throw NotFoundException if person does not belong to user', async () => {
    prisma.person.findFirst.mockResolvedValue(null);
    await expect(service.findOne('user-1', 'person-belonging-to-user-2')).rejects.toThrow(
      NotFoundException,
    );
  });
});
