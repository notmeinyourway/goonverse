import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { HashingService } from '../common/services/hashing.service';
import { StorageService } from '../storage/storage.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let usersService: UsersService;
  let prismaService: any;
  let hashingService: any;
  let storageService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        updateMany: jest.fn(),
      },
      person: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
      },
      image: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
      },
      activity: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      tag: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
    };

    hashingService = {
      verifyPassword: jest.fn(),
      hashPassword: jest.fn().mockResolvedValue('new_hashed_password'),
    };

    storageService = {
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaService },
        { provide: HashingService, useValue: hashingService },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('getMe', () => {
    it('should return user profile with counts', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        email: 'test@example.com',
        username: 'user1',
        role: 'USER',
        age_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        _count: {
          people: 5,
          images: 12,
          activities: 45,
        },
      };

      prismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await usersService.getMe('user-uuid-1');
      expect(result.id).toBe('user-uuid-1');
      expect(result.counts.people).toBe(5);
      expect(result.counts.images).toBe(12);
      expect(result.counts.activities).toBe(45);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);
      await expect(usersService.getMe('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should throw BadRequestException if current password is wrong', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        password_hash: 'current_hash',
      });
      hashingService.verifyPassword.mockResolvedValue(false);

      await expect(
        usersService.changePassword('user-uuid-1', {
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update password and revoke refresh tokens on valid current password', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        password_hash: 'current_hash',
      });
      hashingService.verifyPassword.mockResolvedValue(true);
      prismaService.user.update.mockResolvedValue({});
      prismaService.refreshToken.updateMany.mockResolvedValue({});

      const result = await usersService.changePassword('user-uuid-1', {
        currentPassword: 'CorrectPassword123!',
        newPassword: 'NewPassword123!',
      });

      expect(result.success).toBe(true);
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: { password_hash: 'new_hashed_password' },
        }),
      );
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { user_id: 'user-uuid-1', revoked_at: null },
        data: { revoked_at: expect.any(Date) },
      });
    });
  });

  describe('deleteMe', () => {
    it('should soft delete user, revoke tokens, and soft delete associated people and images', async () => {
      prismaService.user.findFirst.mockResolvedValue({ id: 'user-uuid-1' });

      const result = await usersService.deleteMe('user-uuid-1');
      expect(result.success).toBe(true);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(storageService.deleteObject).not.toHaveBeenCalled(); // 0 images in mock
    });
  });

  describe('exportUserData', () => {
    it('should export all user data metadata', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@example.com',
        username: 'vaultuser',
        role: 'USER',
        age_verified: true,
        created_at: new Date(),
      });

      const result = await usersService.exportUserData('user-uuid-1');
      expect(result.profile.username).toBe('vaultuser');
      expect(result.exportMetadata.app).toBe('Goonverse Vault');
    });
  });
});
