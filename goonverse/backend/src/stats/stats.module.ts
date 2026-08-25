import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StreakService } from './streak.service';
import { StatsController } from './stats.controller';

@Module({
  controllers: [StatsController],
  providers: [StatsService, StreakService],
  exports: [StatsService, StreakService],
})
export class StatsModule {}
