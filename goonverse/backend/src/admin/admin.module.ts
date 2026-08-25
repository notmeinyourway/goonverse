import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

import { AdminAuditService } from './services/admin-audit.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminImagesService } from './services/admin-images.service';
import { AdminActivitiesService } from './services/admin-activities.service';
import { AdminReportsService } from './services/admin-reports.service';

import { AdminController } from './controllers/admin.controller';
import { ReportsController } from './controllers/reports.controller';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [AdminController, ReportsController],
  providers: [
    AdminAuditService,
    AdminDashboardService,
    AdminUsersService,
    AdminImagesService,
    AdminActivitiesService,
    AdminReportsService,
  ],
  exports: [
    AdminAuditService,
    AdminDashboardService,
    AdminUsersService,
    AdminImagesService,
    AdminActivitiesService,
    AdminReportsService,
  ],
})
export class AdminModule {}
