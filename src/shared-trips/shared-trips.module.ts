import { Module } from '@nestjs/common';
import { SharedTripsController } from './shared-trips.controller';
import { SharedTripsService } from './shared-trips.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {SharedTripsRepository} from "./shared-trips.repository";
import {TripModule} from "../trip/trip.module";
import {AuthModule} from "../auth/auth.module";
import {PassportModule} from "@nestjs/passport";

@Module({
  imports: [
    TypeOrmModule.forFeature([SharedTripsRepository]),
    TripModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [SharedTripsController],
  providers: [SharedTripsService],
  exports: [SharedTripsService]
})
export class SharedTripsModule {}
