import { HttpModule, Module } from "@nestjs/common";
import { DistanceController } from "./distance.controller";
import { DistanceService } from "./distance.service";
import { AuthModule } from "../auth/auth.module";
import { PassportModule } from "@nestjs/passport";
import { DistanceRepository } from "./distance.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TaskStatusModule } from "../task-status/task-status.module";
import { TripModule } from "../trip/trip.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([DistanceRepository]),
    HttpModule,
    AuthModule,
    PassportModule,
    TaskStatusModule,
    TripModule,
  ],
  controllers: [DistanceController],
  providers: [DistanceService],
})
export class DistanceModule {}
