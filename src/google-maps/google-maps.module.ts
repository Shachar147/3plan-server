import { Module } from '@nestjs/common';
import { GoogleMapsController } from './google-maps.controller';
import { GoogleMapsService } from './google-maps.service';

@Module({
  controllers: [GoogleMapsController],
  providers: [GoogleMapsService]
})
export class GoogleMapsModule {}
