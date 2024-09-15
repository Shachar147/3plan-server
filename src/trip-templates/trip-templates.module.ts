import { Module } from '@nestjs/common';
import { TripTemplatesController } from './trip-templates.controller';
import { TripTemplatesService } from './trip-templates.service';
import {UserModule} from "../user/user.module";
import {AuthModule} from "../auth/auth.module";
import {PassportModule} from "@nestjs/passport";
import {TripModule} from "../trip/trip.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {TripRepository} from "../trip/trip.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([TripRepository]),
    TripModule,
    UserModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [TripTemplatesController],
  providers: [TripTemplatesService]
})
export class TripTemplatesModule {}
