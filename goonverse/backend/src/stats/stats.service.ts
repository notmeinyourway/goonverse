import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StreakService } from './streak.service';

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly streakService: StreakService,
  ) {}

  /**
   * Get comprehensive dashboard overview metrics
   */
  async getOverview(userId: string, timezoneOffsetMinutes = 0) {
    const now = new Date();
    const todayKey = this.streakService.formatDateKey(now, timezoneOffsetMinutes);

    // Fetch all user activity timestamps for deterministic streak calculation
    const allActivities = await this.prisma.activity.findMany({
      where: { user_id: userId },
      select: { occurred_at: true },
      orderBy: { occurred_at: 'asc' },
    });

    const streakResult = this.streakService.calculateStreaks(
      allActivities.map((a) => a.occurred_at),
      now,
      timezoneOffsetMinutes,
    );

    // Calculate today, week (last 7 days), and month (last 30 days) counts
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let todayCount = 0;
    let weeklyCount = 0;
    let monthlyCount = 0;

    for (const act of allActivities) {
      const actDate = new Date(act.occurred_at);
      const actKey = this.streakService.formatDateKey(actDate, timezoneOffsetMinutes);

      if (actKey === todayKey) {
        todayCount += 1;
      }
      if (actDate >= sevenDaysAgo) {
        weeklyCount += 1;
      }
      if (actDate >= thirtyDaysAgo) {
        monthlyCount += 1;
      }
    }

    const [peopleCount, imagesCount] = await Promise.all([
      this.prisma.person.count({
        where: { user_id: userId, deleted_at: null },
      }),
      this.prisma.image.count({
        where: { user_id: userId, deleted_at: null },
      }),
    ]);

    return {
      totalActivities: allActivities.length,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      totalActiveDays: streakResult.totalActiveDays,
      todayActivities: todayCount,
      weeklyActivities: weeklyCount,
      monthlyActivities: monthlyCount,
      totalPeople: peopleCount,
      totalImages: imagesCount,
      lastActivityDate: streakResult.lastActivityDate,
    };
  }

  /**
   * Get detailed streak metrics and milestone achievements
   */
  async getStreak(userId: string, timezoneOffsetMinutes = 0) {
    const now = new Date();
    const allActivities = await this.prisma.activity.findMany({
      where: { user_id: userId },
      select: { occurred_at: true },
      orderBy: { occurred_at: 'asc' },
    });

    const streakResult = this.streakService.calculateStreaks(
      allActivities.map((a) => a.occurred_at),
      now,
      timezoneOffsetMinutes,
    );

    const milestones = [
      { target: 3, name: '3-Day Starter', achieved: streakResult.longestStreak >= 3 },
      { target: 7, name: '1-Week Champion', achieved: streakResult.longestStreak >= 7 },
      { target: 14, name: '2-Week Master', achieved: streakResult.longestStreak >= 14 },
      { target: 30, name: 'Monthly Legend', achieved: streakResult.longestStreak >= 30 },
      { target: 69, name: '69-Day Milestone', achieved: streakResult.longestStreak >= 69 },
      { target: 100, name: 'Century Club', achieved: streakResult.longestStreak >= 100 },
    ];

    return {
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      totalActiveDays: streakResult.totalActiveDays,
      lastActivityDate: streakResult.lastActivityDate,
      milestones,
    };
  }

  /**
   * Get calendar heatmap counts mapped by YYYY-MM-DD
   */
  async getCalendar(
    userId: string,
    startDate?: string,
    endDate?: string,
    timezoneOffsetMinutes = 0,
  ) {
    const whereClause: any = { user_id: userId };

    if (startDate || endDate) {
      whereClause.occurred_at = {};
      if (startDate) whereClause.occurred_at.gte = new Date(startDate);
      if (endDate) whereClause.occurred_at.lte = new Date(endDate);
    }

    const activities = await this.prisma.activity.findMany({
      where: whereClause,
      select: { occurred_at: true },
      orderBy: { occurred_at: 'asc' },
    });

    const calendarCounts: Record<string, number> = {};

    for (const act of activities) {
      const dateKey = this.streakService.formatDateKey(act.occurred_at, timezoneOffsetMinutes);
      calendarCounts[dateKey] = (calendarCounts[dateKey] || 0) + 1;
    }

    return {
      startDate: startDate || null,
      endDate: endDate || null,
      totalRecorded: activities.length,
      days: calendarCounts,
    };
  }
}
