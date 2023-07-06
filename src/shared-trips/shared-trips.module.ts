import { Module } from '@nestjs/common';
import { SharedTripsController } from './shared-trips.controller';
import { SharedTripsService } from './shared-trips.service';

@Module({
  controllers: [SharedTripsController],
  providers: [SharedTripsService]
})
export class SharedTripsModule {}
