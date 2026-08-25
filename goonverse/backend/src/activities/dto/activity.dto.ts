import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateActivityDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'Person UUID associated with this activity' })
  @IsOptional()
  @IsUUID('4', { message: 'personId must be a valid UUID' })
  personId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Image UUID associated with this activity' })
  @IsOptional()
  @IsUUID('4', { message: 'imageId must be a valid UUID' })
  imageId?: string;

  @ApiPropertyOptional({
    example: '2026-08-25T14:30:00.000Z',
    description: 'ISO-8601 timestamp when activity occurred. Defaults to now.',
  })
  @IsOptional()
  @IsDateString({}, { message: 'occurredAt must be a valid ISO 8601 date string' })
  occurredAt?: string;

  @ApiPropertyOptional({ example: 'Felt great session', description: 'Optional personal notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryActivitiesDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by person UUID' })
  @IsOptional()
  @IsUUID('4')
  personId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by image UUID' })
  @IsOptional()
  @IsUUID('4')
  imageId?: string;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z', description: 'Filter start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59.999Z', description: 'Filter end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ActivityResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiPropertyOptional({ example: 'uuid' })
  person_id?: string | null;

  @ApiPropertyOptional({ example: 'uuid' })
  image_id?: string | null;

  @ApiProperty({ example: '2026-08-25T14:30:00.000Z' })
  occurred_at: Date;

  @ApiPropertyOptional({ example: 'Great session' })
  notes?: string | null;

  @ApiProperty({ example: '2026-08-25T14:30:00.000Z' })
  created_at: Date;

  @ApiPropertyOptional({
    example: { id: 'uuid', name: 'Alice' },
  })
  person?: { id: string; name: string } | null;

  @ApiPropertyOptional({
    example: { id: 'uuid', original_filename: 'photo.jpg', mime_type: 'image/jpeg' },
  })
  image?: { id: string; original_filename: string; mime_type: string } | null;
}
