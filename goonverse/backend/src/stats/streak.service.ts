import { Injectable } from '@nestjs/common';

export interface StreakCalculationResult {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActivityDate: string | null; // YYYY-MM-DD
}

@Injectable()
export class StreakService {
  /**
   * Convert a Date or ISO string to local calendar date key: YYYY-MM-DD
   * respecting timezone offset in minutes (e.g., UTC+5:30 is -330 or +330)
   */
  formatDateKey(date: Date | string, timezoneOffsetMinutes: number = 0): string {
    const d = new Date(date);
    // Adjust timestamp for timezone offset (in minutes)
    // Javascript Date.getTimezoneOffset() returns minutes west of UTC (positive for Americas, negative for Asia/Europe)
    // If timezoneOffsetMinutes is given as client's offset in minutes, we shift milliseconds accordingly
    const targetTime = d.getTime() - timezoneOffsetMinutes * 60 * 1000;
    const adjustedDate = new Date(targetTime);

    const year = adjustedDate.getUTCFullYear();
    const month = String(adjustedDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Calculate current and longest streaks from a list of activity dates
   */
  calculateStreaks(
    activityDates: (Date | string)[],
    referenceDate: Date = new Date(),
    timezoneOffsetMinutes: number = 0,
  ): StreakCalculationResult {
    if (!activityDates || activityDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        lastActivityDate: null,
      };
    }

    // 1. Extract unique sorted calendar date strings (YYYY-MM-DD)
    const uniqueDaysSet = new Set<string>();
    for (const dt of activityDates) {
      uniqueDaysSet.add(this.formatDateKey(dt, timezoneOffsetMinutes));
    }

    const sortedDays = Array.from(uniqueDaysSet).sort(); // Ascending chronological order

    if (sortedDays.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        lastActivityDate: null,
      };
    }

    // 2. Calculate longest streak and all streak blocks
    let longestStreak = 0;
    let currentStreakCount = 0;
    let previousDayTimestamp: number | null = null;

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    for (let i = 0; i < sortedDays.length; i++) {
      const [year, month, day] = sortedDays[i].split('-').map(Number);
      const dayTimestamp = Date.UTC(year, month - 1, day);

      if (previousDayTimestamp === null) {
        currentStreakCount = 1;
      } else {
        const diffDays = Math.round((dayTimestamp - previousDayTimestamp) / ONE_DAY_MS);
        if (diffDays === 1) {
          currentStreakCount += 1;
        } else {
          currentStreakCount = 1;
        }
      }

      if (currentStreakCount > longestStreak) {
        longestStreak = currentStreakCount;
      }

      previousDayTimestamp = dayTimestamp;
    }

    // 3. Determine current active streak relative to reference date (today)
    const todayKey = this.formatDateKey(referenceDate, timezoneOffsetMinutes);
    const [tYear, tMonth, tDay] = todayKey.split('-').map(Number);
    const todayTimestamp = Date.UTC(tYear, tMonth - 1, tDay);

    const yesterdayTimestamp = todayTimestamp - ONE_DAY_MS;
    const yesterdayDate = new Date(yesterdayTimestamp);
    const yesterdayKey = `${yesterdayDate.getUTCFullYear()}-${String(
      yesterdayDate.getUTCMonth() + 1,
    ).padStart(2, '0')}-${String(yesterdayDate.getUTCDate()).padStart(2, '0')}`;

    const lastActiveDay = sortedDays[sortedDays.length - 1];

    let currentStreak = 0;

    // If active today or yesterday, streak is currently alive
    if (lastActiveDay === todayKey || lastActiveDay === yesterdayKey) {
      let tempCount = 0;
      let expectedTimestamp =
        lastActiveDay === todayKey ? todayTimestamp : yesterdayTimestamp;

      for (let i = sortedDays.length - 1; i >= 0; i--) {
        const [y, m, d] = sortedDays[i].split('-').map(Number);
        const curTimestamp = Date.UTC(y, m - 1, d);

        const diffDays = Math.round((expectedTimestamp - curTimestamp) / ONE_DAY_MS);
        if (diffDays === 0) {
          tempCount += 1;
          expectedTimestamp -= ONE_DAY_MS;
        } else {
          break;
        }
      }
      currentStreak = tempCount;
    } else {
      // Last active date was before yesterday, so streak is broken (0)
      currentStreak = 0;
    }

    return {
      currentStreak,
      longestStreak,
      totalActiveDays: sortedDays.length,
      lastActivityDate: lastActiveDay,
    };
  }
}
