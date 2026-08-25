import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { HashingService } from '../common/services/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: any;
  let hashingService: any;
  let jwtService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    hashingService = {
      hashPassword: jest.fn().mockResolvedValue('$argon2id$mockhash'),
      verifyPassword: jest.fn(),
      hashToken: jest.fn().mockReturnValue('mock_sha256_hash'),
      generateSecureToken: jest.fn().mockReturnValue('mock_secure_token_string'),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock_jwt_access_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: HashingService, useValue: hashingService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_REFRESH_EXPIRATION_DAYS') return '30';
              return null;
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should reject registration if age_verified is false', async () => {
      await expect(
        authService.register({
          email: 'test@example.com',
          username: 'user1',
          password: 'Password123!',
          age_verified: false,
          terms_accepted: true,
          privacy_accepted: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject registration if terms_accepted is false', async () => {
      await expect(
        authService.register({
          email: 'test@example.com',
          username: 'user1',
          password: 'Password123!',
          age_verified: true,
          terms_accepted: false,
          privacy_accepted: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject registration if privacy_accepted is false', async () => {
      await expect(
        authService.register({
          email: 'test@example.com',
          username: 'user1',
          password: 'Password123!',
          age_verified: true,
          terms_accepted: true,
          privacy_accepted: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if email already exists', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        email: 'test@example.com',
        username: 'other',
      });

      await expect(
        authService.register({
          email: 'test@example.com',
          username: 'user1',
          password: 'Password123!',
          age_verified: true,
          terms_accepted: true,
          privacy_accepted: true,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register a valid 18+ user and return auth tokens', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);
      const mockCreatedUser = {
        id: 'user-uuid-1',
        email: 'test@example.com',
        username: 'user1',
        role: 'USER',
        age_verified: true,
        terms_accepted_at: new Date(),
        privacy_accepted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };
      prismaService.user.create.mockResolvedValue(mockCreatedUser);
      prismaService.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await authService.register({
        email: 'test@example.com',
        username: 'user1',
        password: 'Password123!',
        age_verified: true,
        terms_accepted: true,
        privacy_accepted: true,
      });

      expect(result.accessToken).toBe('mock_jwt_access_token');
      expect(result.refreshToken).toBe('mock_secure_token_string');
      expect(result.user.id).toBe('user-uuid-1');
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException on invalid credentials', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.login({
          identifier: 'nonexistent',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should authenticate user and return token pair on valid password', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        email: 'test@example.com',
        username: 'user1',
        password_hash: '$argon2id$mockhash',
        role: 'USER',
        age_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      hashingService.verifyPassword.mockResolvedValue(true);
      prismaService.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await authService.login({
        identifier: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('mock_jwt_access_token');
      expect(result.user.username).toBe('user1');
    });
  });

  describe('refresh', () => {
    it('should rotate refresh token and return new token pair', async () => {
      const expiresFuture = new Date();
      expiresFuture.setDate(expiresFuture.getDate() + 5);

      const mockExistingToken = {
        id: 'rt-1',
        user_id: 'user-uuid-1',
        revoked_at: null,
        expires_at: expiresFuture,
        user: {
          id: 'user-uuid-1',
          email: 'test@example.com',
          username: 'user1',
          role: 'USER',
          age_verified: true,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      };

      prismaService.refreshToken.findFirst.mockResolvedValue(mockExistingToken);
      prismaService.refreshToken.update.mockResolvedValue({});
      prismaService.refreshToken.create.mockResolvedValue({ id: 'rt-2' });

      const result = await authService.refresh({ refreshToken: 'valid-refresh-token' });

      expect(result.accessToken).toBe('mock_jwt_access_token');
      // Verifies old token revocation
      expect(prismaService.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-1' },
          data: expect.objectContaining({ revoked_at: expect.any(Date) }),
        }),
      );
    });

    it('should detect replay attack on revoked token and invalidate all active sessions', async () => {
      const mockRevokedToken = {
        id: 'rt-old',
        user_id: 'user-uuid-1',
        revoked_at: new Date(),
        expires_at: new Date(Date.now() + 1000000),
        user: { id: 'user-uuid-1' },
      };

      prismaService.refreshToken.findFirst.mockResolvedValue(mockRevokedToken);

      await expect(
        authService.refresh({ refreshToken: 'replayed-revoked-token' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { user_id: 'user-uuid-1', revoked_at: null },
        data: { revoked_at: expect.any(Date) },
      });
    });
  });
});
