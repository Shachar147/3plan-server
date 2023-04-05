import { Module } from '@nestjs/common';
import { GoogleMapsController } from './google-maps.controller';
import { GoogleMapsService } from './google-maps.service';
import {GraphHopperService} from "./open-street-map.service";

@Module({
  controllers: [GoogleMapsController],
  providers: [GoogleMapsService, GraphHopperService]
})
export class GoogleMapsModule {}
