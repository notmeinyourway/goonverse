import { StreakService } from './streak.service';

describe('StreakService', () => {
  let service: StreakService;

  beforeEach(() => {
    service = new StreakService();
  });

  const refDate = new Date('2026-08-25T12:00:00.000Z'); // Tuesday

  it('should return 0 streaks for empty activity history', () => {
    const result = service.calculateStreaks([], refDate, 0);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalActiveDays).toBe(0);
    expect(result.lastActivityDate).toBeNull();
  });

  it('should return 1 for a single activity today', () => {
    const dates = ['2026-08-25T08:30:00.000Z'];
    const result = service.calculateStreaks(dates, refDate, 0);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.totalActiveDays).toBe(1);
  });

  it('should maintain streak of 1 if last activity was yesterday and none recorded yet today', () => {
    const dates = ['2026-08-24T20:00:00.000Z'];
    const result = service.calculateStreaks(dates, refDate, 0);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('should count multiple activities on the same day as 1 active day and 1 streak day', () => {
    const dates = [
      '2026-08-25T02:00:00.000Z',
      '2026-08-25T09:15:00.000Z',
      '2026-08-25T15:45:00.000Z',
      '2026-08-25T22:10:00.000Z',
    ];
    const result = service.calculateStreaks(dates, refDate, 0);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.totalActiveDays).toBe(1);
  });

  it('should calculate consecutive days streak correctly', () => {
    const dates = [
      '2026-08-23T10:00:00.000Z',
      '2026-08-24T14:00:00.000Z',
      '2026-08-25T08:00:00.000Z',
    ];
    const result = service.calculateStreaks(dates, refDate, 0);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.totalActiveDays).toBe(3);
  });

  it('should return currentStreak = 0 if gap exists (missing yesterday and today)', () => {
    const dates = [
      '2026-08-20T10:00:00.000Z',
      '2026-08-21T10:00:00.000Z',
      '2026-08-22T10:00:00.000Z',
      '2026-08-23T10:00:00.000Z', // 4 consecutive days, ended Sunday
      // 2026-08-24 (Monday): gap
      // 2026-08-25 (Tuesday / refDate): gap
    ];
    const result = service.calculateStreaks(dates, refDate, 0);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(4);
    expect(result.totalActiveDays).toBe(4);
  });

  it('should track longest streak across multiple distinct streaks in history', () => {
    const dates = [
      // Past streak of 5 days
      '2026-08-01T10:00:00.000Z',
      '2026-08-02T10:00:00.000Z',
      '2026-08-03T10:00:00.000Z',
      '2026-08-04T10:00:00.000Z',
      '2026-08-05T10:00:00.000Z',
      // Gap
      // Current streak of 2 days
      '2026-08-24T10:00:00.000Z',
      '2026-08-25T10:00:00.000Z',
    ];
    const result = service.calculateStreaks(dates, refDate, 0);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5);
    expect(result.totalActiveDays).toBe(7);
  });
});
