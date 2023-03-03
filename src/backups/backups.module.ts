import { Module } from '@nestjs/common';
import { BackupsService } from './backups.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {BackupsRepository} from "./backups.repository";
import {BackupsController} from "./backups.controller";
import {AuthModule} from "../auth/auth.module";

@Module({
  imports: [
      TypeOrmModule.forFeature([BackupsRepository]),
      AuthModule
  ],
  controllers: [BackupsController],
  providers: [BackupsService],
  exports: [BackupsService]
})
export class BackupsModule {}
