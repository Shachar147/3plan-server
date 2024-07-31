import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import {AuthModule} from "../auth/auth.module";
import {PassportModule} from "@nestjs/passport";
import {TripModule} from "../trip/trip.module";
import {UserModule} from "../user/user.module";

@Module({
  imports: [
    AuthModule,
    PassportModule,
    TripModule,
    UserModule
  ],
  controllers: [AIController],
  providers: [AIService]
})
export class AiModule {}
