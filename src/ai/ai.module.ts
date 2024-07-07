import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import {AuthModule} from "../auth/auth.module";
import {PassportModule} from "@nestjs/passport";

@Module({
  imports: [
    AuthModule,
    PassportModule,
  ],
  controllers: [AIController],
  providers: [AIService]
})
export class AiModule {}
