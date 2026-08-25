import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePersonDto {
  @ApiProperty({ example: 'Alice', description: 'Name of the person entity' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(1, { message: 'Name must be at least 1 character' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({ example: 'Personal notes or preferences', description: 'Optional private notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePersonDto {
  @ApiPropertyOptional({ example: 'Alice Smith', description: 'Updated name' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Name must be at least 1 character' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({ example: 'Updated notes', description: 'Updated private notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryPeopleDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Items per page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ example: 'Ali', description: 'Search term for name matching' })
  @IsOptional()
  @IsString()
  q?: string;
}

export class PersonResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Alice' })
  name: string;

  @ApiPropertyOptional({ example: 'Personal notes' })
  notes?: string | null;

  @ApiProperty({ example: '2026-08-25T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-08-25T10:00:00.000Z' })
  updated_at: Date;

  @ApiProperty({ example: 5, description: 'Count of associated active images' })
  imageCount?: number;

  @ApiProperty({ example: 12, description: 'Count of recorded activities' })
  activityCount?: number;
}
