import { HttpModule, Module } from '@nestjs/common';
import { PlacesPhotosController } from './places-photos.controller';
import { PlacesPhotosService } from './places-photos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { PlacesPhotosRepository } from './places-photos.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlacesPhotosRepository]),
    HttpModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [PlacesPhotosController],
  providers: [PlacesPhotosService],
  exports: [PlacesPhotosService],
})
export class PlacesPhotosModule {}
