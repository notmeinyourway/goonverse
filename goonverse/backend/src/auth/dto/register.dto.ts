import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  Equals,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Unique user email address' })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'vaultkeeper', description: 'Unique alphanumeric username (3-30 chars)' })
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain alphanumeric characters, underscores, and hyphens',
  })
  username: string;

  @ApiProperty({
    example: 'SuperSecret123!',
    description: 'Strong password with uppercase, lowercase, and numbers/symbols',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password cannot exceed 100 characters' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase letters, lowercase letters, and numbers or symbols',
  })
  password: string;

  @ApiProperty({
    example: true,
    description: 'Mandatory verification that user is at least 18 years old',
  })
  @IsBoolean()
  @Equals(true, {
    message: 'You must verify that you are at least 18 years of age to register for Goonverse',
  })
  age_verified: boolean;

  @ApiProperty({
    example: true,
    description: 'Mandatory agreement to terms of service',
  })
  @IsBoolean()
  @Equals(true, {
    message: 'You must accept the terms of service to register',
  })
  terms_accepted: boolean;

  @ApiProperty({
    example: true,
    description: 'Mandatory agreement to privacy policy',
  })
  @IsBoolean()
  @Equals(true, {
    message: 'You must accept the privacy policy to register',
  })
  privacy_accepted: boolean;
}
