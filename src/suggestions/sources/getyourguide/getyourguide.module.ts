import { Module } from '@nestjs/common';
import {AuthModule} from "../../../auth/auth.module";
import {PassportModule} from "@nestjs/passport";
import {GetYourGuideController} from "./getyourguide.controller";
import {GetYourGuideService} from "./getyourguide.service";

@Module({
    imports: [
        // TypeOrmModule.forFeature([SharedTripsRepository]),
        AuthModule,
        PassportModule,
    ],
    controllers: [GetYourGuideController],
    providers: [GetYourGuideService],
    exports: [GetYourGuideService]
})
export class GetYourGuideModule {}
