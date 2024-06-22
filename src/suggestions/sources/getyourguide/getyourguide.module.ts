// getyourguide.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { GetYourGuideController } from './getyourguide.controller';
import { GetYourGuideService } from './getyourguide.service';
import {PoiModule} from "../../../poi/poi.module";

@Module({
    imports: [
        PoiModule, // Import the PoiModule here
        AuthModule,
        PassportModule,
    ],
    controllers: [GetYourGuideController],
    providers: [GetYourGuideService],
    exports: [GetYourGuideService],
})
export class GetYourGuideModule {}
