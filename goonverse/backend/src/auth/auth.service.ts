import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { HashingService } from '../common/services/hashing.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user with 18+ verification and terms acceptance
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    if (!dto.age_verified) {
      throw new BadRequestException('Registration rejected: Goonverse is strictly 18+');
    }
    if (!dto.terms_accepted) {
      throw new BadRequestException('Registration rejected: Terms of service must be accepted');
    }
    if (!dto.privacy_accepted) {
      throw new BadRequestException('Registration rejected: Privacy policy must be accepted');
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    const normalizedUsername = dto.username.toLowerCase().trim();

    // Check existing email or username
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
      },
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        throw new ConflictException('An account with this email already exists');
      }
      throw new ConflictException('This username is already taken');
    }

    // Hash password with Argon2
    const passwordHash = await this.hashingService.hashPassword(dto.password);
    const now = new Date();

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        password_hash: passwordHash,
        age_verified: true,
        terms_accepted_at: now,
        privacy_accepted_at: now,
      },
    });

    this.logger.log(`New user registered: ${user.id} (${user.username})`);

    return this.generateAuthResponse(user);
  }

  /**
   * Authenticate user with identifier (email or username) and password
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const identifier = dto.identifier.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
        deleted_at: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashingService.verifyPassword(
      user.password_hash,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.suspended_at) {
      throw new ForbiddenException(
        `Account suspended: ${user.suspension_reason || 'Violation of Terms/Content Policy. Contact support.'}`,
      );
    }

    return this.generateAuthResponse(user);
  }

  /**
   * Refresh session with refresh token rotation and replay-attack detection
   */
  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const tokenHash = this.hashingService.hashToken(dto.refreshToken);

    const existingToken = await this.prisma.refreshToken.findFirst({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!existingToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // If token was already revoked, potential token theft/replay detected: revoke all tokens for safety
    if (existingToken.revoked_at) {
      this.logger.warn(
        `Revoked token reuse detected for user ${existingToken.user_id}! Revoking all active sessions.`,
      );
      await this.prisma.refreshToken.updateMany({
        where: { user_id: existingToken.user_id, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      throw new UnauthorizedException('Security alert: Refresh token has already been used and revoked');
    }

    // Check expiration
    if (existingToken.expires_at < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: { revoked_at: new Date() },
      });
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Check if user is active
    if (existingToken.user.deleted_at) {
      throw new UnauthorizedException('User account has been deactivated');
    }

    if (existingToken.user.suspended_at) {
      throw new ForbiddenException(
        `Account suspended: ${existingToken.user.suspension_reason || 'Violation of Terms/Content Policy'}`,
      );
    }

    // Revoke the old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revoked_at: new Date() },
    });

    // Generate new token pair
    return this.generateAuthResponse(existingToken.user);
  }

  /**
   * Logout user by revoking refresh token(s)
   */
  async logout(userId: string, refreshToken?: string): Promise<{ success: boolean; message: string }> {
    if (refreshToken) {
      const tokenHash = this.hashingService.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { user_id: userId, token_hash: tokenHash, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { user_id: userId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    }

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * List active login sessions for user
   */
  async listActiveSessions(userId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        user_id: userId,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        created_at: true,
        expires_at: true,
      },
    });

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        createdAt: s.created_at,
        expiresAt: s.expires_at,
      })),
      total: sessions.length,
    };
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, user_id: userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revoked_at: new Date() },
    });

    return { success: true, message: 'Session revoked' };
  }

  /**
   * Revoke all sessions other than current
   */
  async revokeOtherSessions(userId: string, currentRefreshToken?: string) {
    const currentHash = currentRefreshToken
      ? this.hashingService.hashToken(currentRefreshToken)
      : null;

    await this.prisma.refreshToken.updateMany({
      where: {
        user_id: userId,
        revoked_at: null,
        ...(currentHash ? { token_hash: { not: currentHash } } : {}),
      },
      data: { revoked_at: new Date() },
    });

    return { success: true, message: 'Other active sessions revoked' };
  }

  /**
   * Helper to generate JWT access token + secure refresh token and persist hashed token
   */
  private async generateAuthResponse(user: {
    id: string;
    email: string;
    username: string;
    role: string;
    age_verified: boolean;
    created_at: Date;
    updated_at: Date;
  }): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const rawRefreshToken = this.hashingService.generateSecureToken(48);
    const refreshTokenHash = this.hashingService.hashToken(rawRefreshToken);

    const refreshDaysStr =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION_DAYS') ||
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN')?.replace(/\D/g, '') ||
      '30';
    const refreshDays = parseInt(refreshDaysStr, 10) || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    await this.prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: refreshTokenHash,
        expires_at: expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 minutes = 900s
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        age_verified: user.age_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    };
  }
}
