import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { DubaicoilController } from './dubaicoil.controller';
import { DubaicoilService } from './dubaicoil.service';
import {PoiModule} from "../../poi.module";

@Module({
    imports: [
        PoiModule, // Import the PoiModule here
        AuthModule,
        PassportModule,
    ],
    controllers: [DubaicoilController],
    providers: [DubaicoilService],
    exports: [DubaicoilService],
})
export class DubaicoilModule {}
