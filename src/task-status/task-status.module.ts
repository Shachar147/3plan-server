import { HttpModule, Module } from "@nestjs/common";
import { TaskStatusService } from "./task-status.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { PassportModule } from "@nestjs/passport";
import { TaskStatusController } from "./task-status.controller";
import { TaskStatusRepository } from "./task-status.repository";
import { TripModule } from "../trip/trip.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskStatusRepository]),
    HttpModule,
    AuthModule,
    PassportModule,
    TripModule,
  ],
  controllers: [TaskStatusController],
  providers: [TaskStatusService],
  exports: [TaskStatusService],
})
export class TaskStatusModule {}
