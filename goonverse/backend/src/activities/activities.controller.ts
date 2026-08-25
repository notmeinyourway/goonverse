import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import {
  CreateActivityDto,
  QueryActivitiesDto,
  ActivityResponseDto,
} from './dto/activity.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a new private activity against a person and/or image' })
  @ApiResponse({ status: 201, description: 'Activity recorded', type: ActivityResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid ownership, nonexistent resources, or invalid date' })
  async create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List chronological activities with optional filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of activities returned' })
  async findAll(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query() query: QueryActivitiesDto,
  ) {
    return this.activitiesService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single activity details by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the activity' })
  @ApiResponse({ status: 200, description: 'Activity details returned', type: ActivityResponseDto })
  @ApiResponse({ status: 404, description: 'Activity not found or unauthorized' })
  async findOne(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activitiesService.findOne(user.userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an activity record' })
  @ApiParam({ name: 'id', description: 'UUID of the activity' })
  @ApiResponse({ status: 200, description: 'Activity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Activity not found or unauthorized' })
  async remove(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activitiesService.remove(user.userId, id);
  }
}
