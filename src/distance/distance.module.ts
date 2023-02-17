import {HttpModule, Module} from '@nestjs/common';
import { DistanceController } from './distance.controller';
import { DistanceService } from './distance.service';
import {AuthModule} from "../auth/auth.module";
import {PassportModule} from "@nestjs/passport";

@Module({
  imports: [
    HttpModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [DistanceController],
  providers: [DistanceService]
})
export class DistanceModule {}
