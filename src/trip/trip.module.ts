import { HttpModule, Module } from '@nestjs/common';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripRepository } from './trip.repository';

import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import {BackupsModule} from "../backups/backups.module";
import {BackupsRepository} from "../backups/backups.repository";
import {MyWebSocketGateway} from "../websocket/websocket.gateway";
import {SharedTripsRepository} from "../shared-trips/shared-trips.repository";
import {HistoryModule} from "../history/history.module";
import {TripadvisorModule} from "../poi/sources/tripadvisor/tripadvisor.module";
import {PlacesPhotosModule} from "../places-photos/places-photos.module";
import {UserModule} from "../user/user.module";
import {FileUploadModule} from "../file-upload/file-upload.module";
import { WebSocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TripRepository, SharedTripsRepository]),
    TypeOrmModule.forFeature([BackupsRepository]),
    HttpModule,
    AuthModule,
    PassportModule,
    BackupsModule,
    HistoryModule,
    TripadvisorModule,
    PlacesPhotosModule,
    UserModule,
    FileUploadModule,
    WebSocketModule
  ],
  controllers: [TripController],
  providers: [TripService],
  exports: [TripService],
})
export class TripModule {}
