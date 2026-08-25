import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUserPayload } from '../../common/decorators/current-user.decorator';
import { AdminReportsService } from '../services/admin-reports.service';
import { CreateReportDto } from '../dto/admin-reports.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: AdminReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a report regarding prohibited or violating content' })
  @ApiResponse({ status: 201, description: 'Report successfully submitted' })
  async createReport(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    return this.reportsService.createReport(dto, user.userId);
  }
}
