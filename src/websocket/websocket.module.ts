import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyWebSocketGateway } from './websocket.gateway';
import { User } from 'src/user/user.entity';
import { Trip } from 'src/trip/trip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Trip])],
  providers: [MyWebSocketGateway],
  exports: [MyWebSocketGateway],
})
export class WebSocketModule {}
