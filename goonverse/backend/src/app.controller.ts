import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Service health check' })
  @ApiResponse({ status: 200, description: 'Service is operational' })
  getHealth() {
    return {
      status: 'ok',
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Root ping' })
  getRoot() {
    return {
      name: 'Goonverse API',
      status: 'ok',
    };
  }
}
