import { Module } from "@nestjs/common";
import { DistanceController } from "./distance.controller";
import { DistanceService } from "./distance.service";

@Module({
  controllers: [DistanceController],
  providers: [DistanceService],
})
export class DistanceModule {}
