import { Module } from '@nestjs/common';
import { SharedTripsController } from './shared-trips.controller';
import { SharedTripsService } from './shared-trips.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {SharedTripsRepository} from "./shared-trips.repository";
import {TripModule} from "../trip/trip.module";
import {AuthModule} from "../auth/auth.module";
import {PassportModule} from "@nestjs/passport";
import {UserModule} from "../user/user.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([SharedTripsRepository]),
    TripModule,
    UserModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [SharedTripsController],
  providers: [SharedTripsService],
  exports: [SharedTripsService]
})
export class SharedTripsModule {}
