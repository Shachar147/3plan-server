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
import { RoutePlannerModule } from './route-planner/route-planner.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ScheduleModule.forRoot(),
    UserModule,
    TripModule,
    InstagramModule,
    TinderModule,
    HttpModule,
    DistanceModule,
    RoutePlannerModule
  ],
  controllers: [AppController],
  providers: [AppService, TinderService],
})
export class AppModule {}
