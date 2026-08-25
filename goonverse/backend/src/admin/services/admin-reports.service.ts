import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { CreateReportDto, QueryAdminReportsDto, UpdateReportStatusDto } from '../dto/admin-reports.dto';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async createReport(dto: CreateReportDto, reporterUserId: string) {
    const report = await this.prisma.report.create({
      data: {
        reporter_user_id: reporterUserId,
        target_type: dto.targetType,
        target_id: dto.targetId,
        reason: dto.reason,
        description: dto.description || null,
        status: ReportStatus.OPEN,
      },
    });

    await this.auditService.log({
      adminUserId: reporterUserId,
      action: 'REPORT_CREATED',
      targetType: dto.targetType,
      targetId: dto.targetId,
      metadata: { reason: dto.reason, reportId: report.id },
    });

    return report;
  }

  async listReports(dto: QueryAdminReportsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (dto.status) where.status = dto.status;
    if (dto.targetType) where.target_type = dto.targetType;

    const [total, reports] = await Promise.all([
      this.prisma.report.count({ where }),
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          reporter: { select: { id: true, username: true, email: true } },
          reviewer: { select: { id: true, username: true } },
        },
      }),
    ]);

    return {
      data: reports.map((r) => ({
        id: r.id,
        targetType: r.target_type,
        targetId: r.target_id,
        reason: r.reason,
        description: r.description,
        status: r.status,
        resolutionNotes: r.resolution_notes,
        reporter: {
          id: r.reporter.id,
          username: r.reporter.username,
          email: r.reporter.email,
        },
        reviewer: r.reviewer ? { id: r.reviewer.id, username: r.reviewer.username } : null,
        reviewedAt: r.reviewed_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReportDetail(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, username: true, email: true } },
        reviewer: { select: { id: true, username: true } },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return {
      id: report.id,
      targetType: report.target_type,
      targetId: report.target_id,
      reason: report.reason,
      description: report.description,
      status: report.status,
      resolutionNotes: report.resolution_notes,
      reporter: {
        id: report.reporter.id,
        username: report.reporter.username,
        email: report.reporter.email,
      },
      reviewer: report.reviewer ? { id: report.reviewer.id, username: report.reviewer.username } : null,
      reviewedAt: report.reviewed_at,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
    };
  }

  async updateReportStatus(id: string, dto: UpdateReportStatusDto, adminUserId: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    const now = new Date();
    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: dto.status,
        reviewed_by_id: adminUserId,
        reviewed_at: now,
        resolution_notes: dto.resolutionNotes || report.resolution_notes,
      },
    });

    const action =
      dto.status === ReportStatus.RESOLVED
        ? 'REPORT_RESOLVED'
        : dto.status === ReportStatus.DISMISSED
        ? 'REPORT_DISMISSED'
        : 'REPORT_STATUS_UPDATED';

    await this.auditService.log({
      adminUserId,
      action,
      targetType: 'REPORT',
      targetId: report.id,
      metadata: {
        targetType: report.target_type,
        targetId: report.target_id,
        newStatus: dto.status,
        resolutionNotes: dto.resolutionNotes,
      },
    });

    return updated;
  }
}
