import { Module } from '@nestjs/common';
import { BackupsService } from './backups.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {BackupsRepository} from "./backups.repository";
import {BackupsController} from "./backups.controller";
import {AuthModule} from "../auth/auth.module";
import {PassportModule} from "@nestjs/passport";

@Module({
  imports: [
      TypeOrmModule.forFeature([BackupsRepository]),
      AuthModule,
    PassportModule,
  ],
  controllers: [BackupsController],
  providers: [BackupsService],
  exports: [BackupsService]
})
export class BackupsModule {}
