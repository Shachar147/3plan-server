import {HttpModule, Module} from '@nestjs/common';
import { InstagramController } from './instagram.controller';
import { InstagramService } from './instagram.service';
import {TinderModule} from "../integrations/tinder/tinder.module";

@Module({
  imports: [
    HttpModule,
    TinderModule
  ],
  controllers: [InstagramController],
  providers: [InstagramService]
})
export class InstagramModule {}
