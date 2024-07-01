// poi.module.ts
import { Module } from '@nestjs/common';
import { PointOfInterestController } from './poi.controller';
import { PointOfInterestService } from './poi.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { PointOfInterestRepository } from './poi.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([PointOfInterestRepository]),
    UserModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [PointOfInterestController],
  providers: [PointOfInterestService],
  exports: [PointOfInterestService], // Ensure it's exported
})
export class PoiModule {}
