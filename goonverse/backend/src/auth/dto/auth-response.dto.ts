import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'vaultkeeper' })
  username: string;

  @ApiProperty({ example: 'USER', enum: ['USER', 'MODERATOR', 'SUPER_ADMIN'] })
  role: string;

  @ApiProperty({ example: true })
  age_verified: boolean;

  @ApiProperty({ example: '2026-08-25T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-08-25T10:00:00.000Z' })
  updated_at: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token (15m)' })
  accessToken: string;

  @ApiProperty({ description: 'Rotated refresh token' })
  refreshToken: string;

  @ApiProperty({ example: 900, description: 'Access token expiration in seconds' })
  expiresIn: number;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
