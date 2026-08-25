import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, ReportStatus, ReportTargetType } from '@prisma/client';

import { RolesGuard } from '../common/guards/roles.guard';
import { AdminAuditService } from './services/admin-audit.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminImagesService } from './services/admin-images.service';
import { AdminReportsService } from './services/admin-reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

describe('Admin RBAC and Moderation Suite', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;
  let auditService: AdminAuditService;
  let usersService: AdminUsersService;
  let imagesService: AdminImagesService;
  let reportsService: AdminReportsService;
  let prisma: PrismaService;
  let storage: StorageService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    image: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    report: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    adminAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn(),
    },
  };

  const mockStorageService = {
    createSignedDownloadUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        Reflector,
        AdminAuditService,
        AdminDashboardService,
        AdminUsersService,
        AdminImagesService,
        AdminReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    auditService = module.get<AdminAuditService>(AdminAuditService);
    usersService = module.get<AdminUsersService>(AdminUsersService);
    imagesService = module.get<AdminImagesService>(AdminImagesService);
    reportsService = module.get<AdminReportsService>(AdminReportsService);
    prisma = module.get<PrismaService>(PrismaService);
    storage = module.get<StorageService>(StorageService);
  });

  describe('1. Server-Side RBAC Enforcement', () => {
    it('should deny access (403) when regular USER tries to access MODERATOR/SUPER_ADMIN endpoint', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.MODERATOR, UserRole.SUPER_ADMIN]);

      const mockExecutionContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'regular-user-id', role: UserRole.USER },
          }),
        }),
      } as any;

      expect(() => rolesGuard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it('should allow access when MODERATOR accesses MODERATOR/SUPER_ADMIN endpoint', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.MODERATOR, UserRole.SUPER_ADMIN]);

      const mockExecutionContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'moderator-id', role: UserRole.MODERATOR },
          }),
        }),
      } as any;

      expect(rolesGuard.canActivate(mockExecutionContext)).toBe(true);
    });

    it('should deny MODERATOR on SUPER_ADMIN exclusive endpoint', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPER_ADMIN]);

      const mockExecutionContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'moderator-id', role: UserRole.MODERATOR },
          }),
        }),
      } as any;

      expect(() => rolesGuard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN on SUPER_ADMIN exclusive endpoint', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPER_ADMIN]);

      const mockExecutionContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'super-admin-id', role: UserRole.SUPER_ADMIN },
          }),
        }),
      } as any;

      expect(rolesGuard.canActivate(mockExecutionContext)).toBe(true);
    });
  });

  describe('2. Admin Image Viewing & Mandatory Audit Trail', () => {
    it('should return short-lived signed URL AND record ADMIN_VIEW_IMAGE audit log', async () => {
      const mockImage = {
        id: 'img-123',
        user_id: 'owner-456',
        storage_key: 'vault/img-123.jpg',
        original_filename: 'sample.jpg',
        mime_type: 'image/jpeg',
        file_size: 102400,
        created_at: new Date(),
        user: { id: 'owner-456', username: 'owner_user', email: 'owner@vault.app' },
        person: { id: 'p-1', name: 'Alice' },
      };

      mockPrismaService.image.findUnique.mockResolvedValue(mockImage);
      mockStorageService.createSignedDownloadUrl.mockResolvedValue('https://signed.b2.download.url/token=xyz');
      mockPrismaService.adminAuditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await imagesService.getAdminImageAccess('img-123', 'admin-789');

      expect(result.url).toBe('https://signed.b2.download.url/token=xyz');
      expect(result.expiresIn).toBe(900);
      expect(storage.createSignedDownloadUrl).toHaveBeenCalledWith('vault/img-123.jpg', 900);

      // Verify audit log creation
      expect(mockPrismaService.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          admin_user_id: 'admin-789',
          action: 'ADMIN_VIEW_IMAGE',
          target_type: 'IMAGE',
          target_id: 'img-123',
          metadata: expect.objectContaining({
            originalFilename: 'sample.jpg',
            ownerUserId: 'owner-456',
          }),
        }),
      });
    });
  });

  describe('3. User Suspension & Session Revocation', () => {
    it('should set suspended_at, revoke refresh tokens, and write ADMIN_SUSPEND_USER audit', async () => {
      const targetUser = {
        id: 'target-user-1',
        username: 'violating_user',
        role: UserRole.USER,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(targetUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...targetUser,
        suspended_at: new Date(),
        suspension_reason: 'Terms violation',
      });
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.adminAuditLog.create.mockResolvedValue({ id: 'audit-suspend' });

      const result = await usersService.suspendUser(
        'target-user-1',
        { reason: 'Terms violation' },
        'admin-super',
      );

      expect(result.status).toBe('SUSPENDED');
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { user_id: 'target-user-1', revoked_at: null },
        data: expect.objectContaining({ revoked_at: expect.any(Date) }),
      });
      expect(mockPrismaService.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          admin_user_id: 'admin-super',
          action: 'ADMIN_SUSPEND_USER',
          target_type: 'USER',
          target_id: 'target-user-1',
        }),
      });
    });

    it('should reject suspension of another SUPER_ADMIN', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'other-super',
        role: UserRole.SUPER_ADMIN,
      });

      await expect(
        usersService.suspendUser('other-super', { reason: 'test' }, 'admin-super'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Reports & Moderation Flow', () => {
    it('should create report with OPEN status and log REPORT_CREATED', async () => {
      mockPrismaService.report.create.mockResolvedValue({
        id: 'rep-1',
        reporter_user_id: 'reporter-1',
        target_type: ReportTargetType.IMAGE,
        target_id: 'img-999',
        reason: 'Inappropriate content',
        status: ReportStatus.OPEN,
      });
      mockPrismaService.adminAuditLog.create.mockResolvedValue({ id: 'audit-rep' });

      const result = await reportsService.createReport(
        {
          targetType: ReportTargetType.IMAGE,
          targetId: 'img-999',
          reason: 'Inappropriate content',
        },
        'reporter-1',
      );

      expect(result.status).toBe(ReportStatus.OPEN);
      expect(mockPrismaService.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'REPORT_CREATED',
          target_type: ReportTargetType.IMAGE,
          target_id: 'img-999',
        }),
      });
    });

    it('should resolve report and log REPORT_RESOLVED', async () => {
      mockPrismaService.report.findUnique.mockResolvedValue({
        id: 'rep-1',
        target_type: ReportTargetType.IMAGE,
        target_id: 'img-999',
        status: ReportStatus.OPEN,
      });
      mockPrismaService.report.update.mockResolvedValue({
        id: 'rep-1',
        status: ReportStatus.RESOLVED,
        resolution_notes: 'Image removed after violation review',
      });
      mockPrismaService.adminAuditLog.create.mockResolvedValue({ id: 'audit-resolve' });

      const result = await reportsService.updateReportStatus(
        'rep-1',
        {
          status: ReportStatus.RESOLVED,
          resolutionNotes: 'Image removed after violation review',
        },
        'moderator-1',
      );

      expect(result.status).toBe(ReportStatus.RESOLVED);
      expect(mockPrismaService.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          admin_user_id: 'moderator-1',
          action: 'REPORT_RESOLVED',
          target_type: 'REPORT',
          target_id: 'rep-1',
        }),
      });
    });
  });
});
