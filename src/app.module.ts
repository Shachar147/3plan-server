import {HttpModule, HttpService, Module} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';
import {TripModule} from "./trip/trip.module";
import { InstagramModule } from './instagram/instagram.module';
import { TinderService } from './integrations/tinder/tinder.service';
import { TinderModule } from './integrations/tinder/tinder.module';
import { DistanceModule } from './distance/distance.module';
import { BackupsModule } from './backups/backups.module';
import { TaskModule } from './task/task.module';
import { StatisticsModule } from './admin-statistics/statistics.module';
import {EmailModule} from "./mail-sender/email.module";
import { BiEventsModule } from './bi-events/bi-events.module';
import { SharedTripsModule } from './shared-trips/shared-trips.module';
import { TodolistModule } from './todolist/todolist.module';
import { GetYourGuideModule } from './poi/sources/getyourguide/getyourguide.module';
import { PoiModule } from './poi/poi.module';
import {DubaicoilModule} from "./poi/sources/dubaicoil/dubaicoil.module";
import {TripadvisorModule} from "./poi/sources/tripadvisor/tripadvisor.module";
import { AiModule } from './ai/ai.module';
import { SavedCollectionsModule } from './saved-collections/saved-collections.module';
import { SavedCollectionsItemModule } from './saved-collections/saved-collections-item/saved-collections-item.module';
import { PlacesPhotosModule } from './places-photos/places-photos.module';
import { TripTemplatesModule } from './trip-templates/trip-templates.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { AutoScheduleModule } from './auto-schedule/auto-schedule.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...typeOrmConfig,
      name: 'default', // for migrations
      keepConnectionAlive: true, // for migrations
    }),
    ScheduleModule.forRoot(),
    UserModule,
    TripModule,
    InstagramModule,
    TinderModule,
    HttpModule,
    DistanceModule,
    BackupsModule,
    TaskModule,
    StatisticsModule,
    EmailModule,
    BiEventsModule,
    SharedTripsModule,
    TodolistModule,
    GetYourGuideModule,
    PoiModule,
    DubaicoilModule,
    TripadvisorModule,
    AiModule,
    SavedCollectionsModule,
    SavedCollectionsItemModule,
    PlacesPhotosModule,
    TripTemplatesModule,
    FileUploadModule,
    AutoScheduleModule,
  ],
  controllers: [AppController],
  providers: [AppService, TinderService],
})
export class AppModule {}
