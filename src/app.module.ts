import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';
import {TripModule} from "./trip/trip.module";

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ScheduleModule.forRoot(),
    UserModule,
    TripModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
