import { HttpModule, Module } from '@nestjs/common';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripRepository } from './trip.repository';

import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import {BackupsModule} from "../backups/backups.module";
import {BackupsRepository} from "../backups/backups.repository";
import {MyWebSocketGateway} from "../websocket.gateway";
import {SharedTripsRepository} from "../shared-trips/shared-trips.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([TripRepository, SharedTripsRepository]),
    TypeOrmModule.forFeature([BackupsRepository]),
    HttpModule,
    AuthModule,
    PassportModule,
    BackupsModule
  ],
  controllers: [TripController],
  providers: [TripService, MyWebSocketGateway],
  exports: [TripService],
})
export class TripModule {}
