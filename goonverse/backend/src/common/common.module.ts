import { Global, Module } from '@nestjs/common';
import { HashingService } from './services/hashing.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  providers: [HashingService, JwtAuthGuard, RolesGuard],
  exports: [HashingService, JwtAuthGuard, RolesGuard],
})
export class CommonModule {}
