import { Module } from "@nestjs/common";
import { AutoScheduleController } from "./auto-schedule.controller";
import { AutoScheduleService } from "./auto-schedule.service";
import { TripModule } from "../trip/trip.module";
import { AuthModule } from "../auth/auth.module";
import { PassportModule } from "@nestjs/passport";

@Module({
  imports: [
    TripModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [AutoScheduleController],
  providers: [AutoScheduleService],
  exports: [AutoScheduleService]
})
export class AutoScheduleModule {} 