import { IsOptional, IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAdminImagesDto {
  @ApiPropertyOptional({ description: 'Filter by owner User ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by Person ID' })
  @IsOptional()
  @IsString()
  personId?: string;

  @ApiPropertyOptional({ description: 'Filter by MIME type' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Filter by status: ACTIVE, DELETED, ALL', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 24;
}

export class RemoveAdminImageDto {
  @ApiProperty({ description: 'Reason for removing this image', example: 'Prohibited content under moderation guidelines' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
