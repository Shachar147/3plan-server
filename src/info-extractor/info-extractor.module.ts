import {HttpModule, Module} from '@nestjs/common';
import { InfoExtractorController } from './info-extractor.controller';
import { InfoExtractorService } from './info-extractor.service';
import {AuthModule} from "../auth/auth.module";
import {PassportModule} from "@nestjs/passport";

@Module({
  imports: [
    HttpModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [InfoExtractorController],
  providers: [InfoExtractorService]
})
export class InfoExtractorModule {}
