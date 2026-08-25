import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile and activity counters' })
  @ApiResponse({ status: 200, description: 'Profile details returned' })
  async getMe(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.usersService.getMe(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile information' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  async updateMe(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(user.userId, dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password and revoke all other active sessions' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 400, description: 'Current password incorrect' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.userId, dto);
  }

  @Get('me/export')
  @ApiOperation({ summary: 'Export full user vault metadata for GDPR/Privacy compliance' })
  @ApiResponse({ status: 200, description: 'Complete user JSON archive returned' })
  async exportMe(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.usersService.exportUserData(user.userId);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete user account and all personal data' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  async deleteMe(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.usersService.deleteMe(user.userId);
  }
}
