import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PeopleService } from './people.service';
import {
  CreatePersonDto,
  UpdatePersonDto,
  QueryPeopleDto,
  PersonResponseDto,
} from './dto/person.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('People')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new private person entry' })
  @ApiResponse({ status: 201, description: 'Person created', type: PersonResponseDto })
  async create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreatePersonDto,
  ) {
    return this.peopleService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List people for authenticated user with search and pagination' })
  @ApiResponse({ status: 200, description: 'List of people returned' })
  async findAll(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query() query: QueryPeopleDto,
  ) {
    return this.peopleService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get person details by ID with associated gallery' })
  @ApiParam({ name: 'id', description: 'UUID of the person' })
  @ApiResponse({ status: 200, description: 'Person details returned', type: PersonResponseDto })
  @ApiResponse({ status: 404, description: 'Person not found or unauthorized' })
  async findOne(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.peopleService.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update person details' })
  @ApiParam({ name: 'id', description: 'UUID of the person' })
  @ApiResponse({ status: 200, description: 'Person updated successfully' })
  @ApiResponse({ status: 404, description: 'Person not found or unauthorized' })
  async update(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePersonDto,
  ) {
    return this.peopleService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete person entry' })
  @ApiParam({ name: 'id', description: 'UUID of the person' })
  @ApiResponse({ status: 200, description: 'Person deleted successfully' })
  @ApiResponse({ status: 404, description: 'Person not found or unauthorized' })
  async remove(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.peopleService.remove(user.userId, id);
  }
}
