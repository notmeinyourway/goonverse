import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ImagesService } from './images.service';
import {
  UploadImageDto,
  QueryImagesDto,
  ImageResponseDto,
  ImageAccessResponseDto,
} from './dto/image.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUserPayload } from '../common/decorators/current-user.decorator';

// 15 MB in bytes
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

@ApiTags('Images')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a new private image with optional person association and tags' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WEBP, GIF, max 15MB)',
        },
        personId: {
          type: 'string',
          format: 'uuid',
          description: 'Optional Person UUID to associate with',
        },
        tags: {
          type: 'string',
          description: 'Comma-separated tag list (e.g. "portrait,favorite")',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully', type: ImageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file type, file too large, or invalid personId' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_IMAGE_SIZE,
      },
    }),
  )
  async upload(
    @CurrentUser() user: AuthenticatedUserPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_IMAGE_SIZE })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadImageDto,
  ) {
    return this.imagesService.upload(user.userId, file, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List private images for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of images metadata returned' })
  async findAll(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query() query: QueryImagesDto,
  ) {
    return this.imagesService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtain temporary short-lived signed access URL for private image' })
  @ApiParam({ name: 'id', description: 'UUID of the image' })
  @ApiResponse({ status: 200, description: 'Temporary signed access URL returned', type: ImageAccessResponseDto })
  @ApiResponse({ status: 404, description: 'Image not found or unauthorized' })
  async getAccess(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.imagesService.getImageAccess(user.userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete image from storage and database' })
  @ApiParam({ name: 'id', description: 'UUID of the image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image not found or unauthorized' })
  async remove(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.imagesService.remove(user.userId, id);
  }
}
