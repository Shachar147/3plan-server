import { HttpModule, Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { PassportModule } from "@nestjs/passport";
import { TaskController } from "./task.controller";
import { TaskRepository } from "./task.repository";
import { TripModule } from "../trip/trip.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskRepository]),
    HttpModule,
    AuthModule,
    PassportModule,
    TripModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
