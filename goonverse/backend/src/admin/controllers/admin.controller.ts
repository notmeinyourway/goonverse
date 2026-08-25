import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

import { AdminDashboardService } from '../services/admin-dashboard.service';
import { AdminUsersService } from '../services/admin-users.service';
import { AdminImagesService } from '../services/admin-images.service';
import { AdminActivitiesService } from '../services/admin-activities.service';
import { AdminReportsService } from '../services/admin-reports.service';
import { AdminAuditService } from '../services/admin-audit.service';

import { QueryAdminUsersDto, SuspendUserDto, UpdateUserRoleDto } from '../dto/admin-users.dto';
import { QueryAdminImagesDto, RemoveAdminImageDto } from '../dto/admin-images.dto';
import { QueryAdminActivitiesDto } from '../dto/admin-activities.dto';
import { QueryAdminReportsDto, UpdateReportStatusDto } from '../dto/admin-reports.dto';
import { QueryAdminAuditLogsDto } from '../dto/admin-audit.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly usersService: AdminUsersService,
    private readonly imagesService: AdminImagesService,
    private readonly activitiesService: AdminActivitiesService,
    private readonly reportsService: AdminReportsService,
    private readonly auditService: AdminAuditService,
  ) {}

  @Get('me')
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get authenticated admin profile and verify session' })
  async getAdminMe(@CurrentUser() admin: AuthenticatedUserPayload) {
    return {
      userId: admin.userId,
      email: admin.email,
      role: admin.role,
    };
  }

  @Get('dashboard')
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard metrics, storage stats, and recent audits' })
  async getDashboard() {
    return this.dashboardService.getDashboardOverview();
  }

  // Users Management
  @Get('users')
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List users with server-side search, pagination, and role/status filters' })
  async listUsers(@Query() dto: QueryAdminUsersDto) {
    return this.usersService.listUsers(dto);
  }

  @Get('users/:id')
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get detailed user profile and logs view audit event' })
  async getUserDetail(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUserPayload,
  ) {
    return this.usersService.getUserDetail(id, admin.userId);
  }

  @Patch('users/:id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend user account and revoke sessions (SUPER_ADMIN only)' })
  async suspendUser(
    @Param('id') id: string,
    @Body() dto: SuspendUserDto,
    @CurrentUser() admin: AuthenticatedUserPayload,
  ) {
    return this.usersService.suspendUser(id, dto, admin.userId);
  }

  @Patch('users/:id/restore')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Restore suspended user account (SUPER_ADMIN only)' })
  async restoreUser(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUserPayload,
  ) {
    return this.usersService.restoreUser(id, admin.userId);
  }

  @Patch('users/:id/role')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change user role (SUPER_ADMIN only)' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() admin: AuthenticatedUserPayload,
  ) {
    return this.usersService.updateUserRole(id, dto, admin.userId);
  }

  // Image Management
  @Get('images')
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List images gallery with filters and server-side pagination' })
  async listImages(@Query() dto: QueryAdminImagesDto) {
    return this.imagesService.listImages(dto);
  }

  @Get('images/:id')
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Generate short-lived signed access URL and log ADMIN_VIEW_IMAGE audit' })
  async getAdminImageAccess(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUserPayload,
  ) {
    return this.imagesService.getAdminImageAccess(id, admin.userId);
  }

  @Delete('images/:id')
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove prohibited image with moderation reason' })
  async removeImage(
    @Param('id') id: string,
    @Body() dto: RemoveAdminImageDto,
    @CurrentUser() admin: AuthenticatedUserPayload,
  ) {
    return this.imagesService.removeImage(id, dto, admin.userId);
  }

  // Activities Management
  @Get('activities')
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List activities with server-side pagination and filters' })
  async listActivities(@Query() dto: QueryAdminActivitiesDto) {
    return this.activitiesService.listActivities(dto);
  }

  // Reports & Moderation Queue
  @Get('reports')
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List reports moderation queue' })
  async listReports(@Query() dto: QueryAdminReportsDto) {
    return this.reportsService.listReports(dto);
  }

  @Get('reports/:id')
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get report detail' })
  async getReportDetail(@Param('id') id: string) {
    return this.reportsService.getReportDetail(id);
  }

  @Patch('reports/:id/status')
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update report status (UNDER_REVIEW, RESOLVED, DISMISSED)' })
  async updateReportStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReportStatusDto,
    @CurrentUser() admin: AuthenticatedUserPayload,
  ) {
    return this.reportsService.updateReportStatus(id, dto, admin.userId);
  }

  // Audit Logs
  @Get('audit-logs')
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Query immutable admin audit logs' })
  async queryAuditLogs(@Query() dto: QueryAdminAuditLogsDto) {
    return this.auditService.queryLogs(dto);
  }

  // Administrator Management
  @Get('admins')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List administrators and moderators (SUPER_ADMIN only)' })
  async listAdmins() {
    return this.usersService.listUsers({
      page: 1,
      limit: 100,
      role: UserRole.MODERATOR,
    });
  }
}
