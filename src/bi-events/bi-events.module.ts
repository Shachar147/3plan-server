import {Module} from '@nestjs/common';
import { BiEventsController } from './bi-events.controller';
import { BiEventsService } from './bi-events.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {AuthModule} from "../auth/auth.module";
import {PassportModule} from "@nestjs/passport";
import {BiEventsRepository} from "./bi-events.repository";
import {GooglePricesService} from "./google-prices.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([BiEventsRepository]),
    AuthModule,
    PassportModule,
  ],
  controllers: [BiEventsController],
  providers: [BiEventsService, GooglePricesService],
  exports: [BiEventsService]
})
export class BiEventsModule {

}
