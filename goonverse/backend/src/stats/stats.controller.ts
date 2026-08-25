import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get general activity, streak, and resource statistics' })
  @ApiQuery({ name: 'tzOffset', required: false, description: 'Client timezone offset in minutes' })
  @ApiResponse({ status: 200, description: 'Overview stats returned' })
  async getOverview(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query('tzOffset') tzOffset?: string,
  ) {
    const offset = tzOffset ? parseInt(tzOffset, 10) || 0 : 0;
    return this.statsService.getOverview(user.userId, offset);
  }

  @Get('streak')
  @ApiOperation({ summary: 'Get streak metrics, active days, and milestone achievements' })
  @ApiQuery({ name: 'tzOffset', required: false, description: 'Client timezone offset in minutes' })
  @ApiResponse({ status: 200, description: 'Streak details returned' })
  async getStreak(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query('tzOffset') tzOffset?: string,
  ) {
    const offset = tzOffset ? parseInt(tzOffset, 10) || 0 : 0;
    return this.statsService.getStreak(user.userId, offset);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get calendar activity counts heatmap' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (ISO string)' })
  @ApiQuery({ name: 'tzOffset', required: false, description: 'Client timezone offset in minutes' })
  @ApiResponse({ status: 200, description: 'Calendar heatmap counts returned' })
  async getCalendar(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tzOffset') tzOffset?: string,
  ) {
    const offset = tzOffset ? parseInt(tzOffset, 10) || 0 : 0;
    return this.statsService.getCalendar(user.userId, startDate, endDate, offset);
  }
}
