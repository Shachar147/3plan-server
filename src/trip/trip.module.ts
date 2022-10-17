import { HttpModule, HttpService, Module } from '@nestjs/common';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripRepository } from './trip.repository';

import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([TripRepository]),
    HttpModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [TripController],
  providers: [TripService],
  exports: [TripService],
})
export class TripModule {}
