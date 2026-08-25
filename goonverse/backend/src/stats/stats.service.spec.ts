import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { StreakService } from './streak.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StatsService', () => {
  let service: StatsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      activity: {
        findMany: jest.fn(),
      },
      person: {
        count: jest.fn().mockResolvedValue(3),
      },
      image: {
        count: jest.fn().mockResolvedValue(10),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        StreakService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  it('should return aggregated overview statistics', async () => {
    const today = new Date();
    prisma.activity.findMany.mockResolvedValue([
      { occurred_at: today },
      { occurred_at: new Date(today.getTime() - 24 * 60 * 60 * 1000) },
    ]);

    const result = await service.getOverview('user-1', 0);
    expect(result.totalActivities).toBe(2);
    expect(result.currentStreak).toBe(2);
    expect(result.totalPeople).toBe(3);
    expect(result.totalImages).toBe(10);
  });

  it('should return streak milestones', async () => {
    prisma.activity.findMany.mockResolvedValue([
      { occurred_at: new Date() },
    ]);

    const result = await service.getStreak('user-1', 0);
    expect(result.currentStreak).toBe(1);
    expect(result.milestones).toBeDefined();
    expect(result.milestones.length).toBeGreaterThan(0);
  });

  it('should return calendar activity heatmaps', async () => {
    const today = new Date();
    prisma.activity.findMany.mockResolvedValue([
      { occurred_at: today },
      { occurred_at: today },
    ]);

    const result = await service.getCalendar('user-1');
    expect(result.totalRecorded).toBe(2);
    expect(Object.keys(result.days).length).toBe(1);
  });
});
