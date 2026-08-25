import { IsOptional, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UploadImageDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'Optional Person UUID to associate image with' })
  @IsOptional()
  @IsUUID('4', { message: 'personId must be a valid UUID' })
  personId?: string;

  @ApiPropertyOptional({ example: 'tags,separated,by,comma', description: 'Optional comma-separated tag names' })
  @IsOptional()
  @IsString()
  tags?: string;
}

export class QueryImagesDto {
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

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter images by person ID' })
  @IsOptional()
  @IsUUID('4')
  personId?: string;
}

export class ImageResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiPropertyOptional({ example: 'uuid' })
  person_id?: string | null;

  @ApiProperty({ example: 'photo.jpg' })
  original_filename: string;

  @ApiProperty({ example: 'image/jpeg' })
  mime_type: string;

  @ApiProperty({ example: 2048500 })
  file_size: number;

  @ApiProperty({ example: '2026-08-25T10:00:00.000Z' })
  created_at: Date;

  @ApiPropertyOptional({ example: ['favorite', 'portrait'] })
  tags?: string[];
}

export class ImageAccessResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'photo.jpg' })
  original_filename: string;

  @ApiProperty({ example: 'image/jpeg' })
  mime_type: string;

  @ApiProperty({ example: 2048500 })
  file_size: number;

  @ApiProperty({
    example: 'https://storage-endpoint.com/bucket/...?X-Amz-Signature=...',
    description: 'Short-lived signed temporary URL (15 minutes). Never permanent.',
  })
  url: string;

  @ApiProperty({ example: 900, description: 'Signed URL validity in seconds' })
  expiresIn: number;
}
