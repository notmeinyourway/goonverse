import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardOverview() {
    const now = new Date();
    const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      suspendedUsers,
      newUsers24h,
      totalImages,
      newImages24h,
      totalActivities,
      newActivities24h,
      storageAggregate,
      openReports,
      underReviewReports,
      recentAuditLogs,
      recentReports,
      mimeTypeBreakdown,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deleted_at: null } }),
      this.prisma.user.count({ where: { suspended_at: { not: null }, deleted_at: null } }),
      this.prisma.user.count({ where: { created_at: { gte: past24Hours }, deleted_at: null } }),
      this.prisma.image.count({ where: { deleted_at: null } }),
      this.prisma.image.count({ where: { created_at: { gte: past24Hours }, deleted_at: null } }),
      this.prisma.activity.count(),
      this.prisma.activity.count({ where: { created_at: { gte: past24Hours } } }),
      this.prisma.image.aggregate({
        _sum: { file_size: true },
        where: { deleted_at: null },
      }),
      this.prisma.report.count({ where: { status: ReportStatus.OPEN } }),
      this.prisma.report.count({ where: { status: ReportStatus.UNDER_REVIEW } }),
      this.prisma.adminAuditLog.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          admin: {
            select: { id: true, username: true, role: true },
          },
        },
      }),
      this.prisma.report.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          reporter: { select: { id: true, username: true } },
        },
      }),
      this.prisma.image.groupBy({
        by: ['mime_type'],
        _count: { _all: true },
        _sum: { file_size: true },
        where: { deleted_at: null },
      }),
    ]);

    const totalStorageBytes = storageAggregate._sum.file_size || 0;
    const totalStorageGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
    const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(1);

    return {
      metrics: {
        users: {
          total: totalUsers,
          active: totalUsers - suspendedUsers,
          suspended: suspendedUsers,
          newLast24Hours: newUsers24h,
        },
        images: {
          total: totalImages,
          newLast24Hours: newImages24h,
          storageBytes: totalStorageBytes,
          storageMB: parseFloat(totalStorageMB),
          storageGB: parseFloat(totalStorageGB),
        },
        activities: {
          total: totalActivities,
          newLast24Hours: newActivities24h,
        },
        moderation: {
          openReports,
          underReviewReports,
          pendingTotal: openReports + underReviewReports,
        },
      },
      storageByMimeType: mimeTypeBreakdown.map((item) => ({
        mimeType: item.mime_type,
        count: item._count._all,
        totalBytes: item._sum.file_size || 0,
        totalMB: ((item._sum.file_size || 0) / (1024 * 1024)).toFixed(1),
      })),
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        adminUserId: log.admin_user_id,
        adminUsername: log.admin?.username || 'Unknown',
        adminRole: log.admin?.role || 'MODERATOR',
        action: log.action,
        targetType: log.target_type,
        targetId: log.target_id,
        metadata: log.metadata,
        createdAt: log.created_at,
      })),
      recentReports: recentReports.map((report) => ({
        id: report.id,
        targetType: report.target_type,
        targetId: report.target_id,
        reason: report.reason,
        status: report.status,
        reporterUsername: report.reporter?.username || 'Anonymous',
        createdAt: report.created_at,
      })),
    };
  }
}
