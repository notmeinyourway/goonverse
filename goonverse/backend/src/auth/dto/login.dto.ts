import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address or username' })
  @IsString()
  @IsNotEmpty({ message: 'Email or username is required' })
  identifier: string;

  @ApiProperty({ example: 'SuperSecret123!', description: 'User password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
