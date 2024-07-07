import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { TripadvisorController } from './tripadvisor.controller';
import { TripadvisorService } from './tripadvisor.service';
import {PoiModule} from "../../poi.module";

@Module({
    imports: [
        PoiModule, // Import the PoiModule here
        AuthModule,
        PassportModule,
    ],
    controllers: [TripadvisorController],
    providers: [TripadvisorService],
    exports: [TripadvisorService],
})
export class TripadvisorModule {}
