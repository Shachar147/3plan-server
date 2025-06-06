import { Module } from "@nestjs/common";
import { AutoScheduleController } from "./auto-schedule.controller";
import { AutoScheduleService } from "./auto-schedule.service";
import { TripModule } from "../trip/trip.module";

@Module({
  imports: [TripModule],
  controllers: [AutoScheduleController],
  providers: [AutoScheduleService],
  exports: [AutoScheduleService]
})
export class AutoScheduleModule {} 