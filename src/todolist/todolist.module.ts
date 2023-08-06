import { Module } from '@nestjs/common';
import { TodolistController } from './todolist.controller';
import { TodolistService } from './todolist.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {TodolistRepository} from "./todolist.repository";
import {TripModule} from "../trip/trip.module";
import {AuthModule} from "../auth/auth.module";
import {PassportModule} from "@nestjs/passport";

@Module({
  imports: [
    TypeOrmModule.forFeature([TodolistRepository]),
    TripModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [TodolistController],
  providers: [TodolistService],
  exports: [TodolistService]
})
export class TodolistModule {}
