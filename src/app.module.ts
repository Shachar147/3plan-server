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
import { StatisticsModule } from './statistics/statistics.module';
import {EmailModule} from "./mail-sender/email.module";
import { BiEventsModule } from './bi-events/bi-events.module';
import { SharedTripsModule } from './shared-trips/shared-trips.module';
import { TodolistModule } from './todolist/todolist.module';
import { GetYourGuideModule } from './suggestions/sources/getyourguide/getyourguide.module';
import { PoiModule } from './poi/poi.module';

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
    PoiModule
  ],
  controllers: [AppController],
  providers: [AppService, TinderService],
})
export class AppModule {}
