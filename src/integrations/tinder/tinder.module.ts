import { HttpModule, Module } from '@nestjs/common';
import {TinderService} from "./tinder.service";

@Module({
    imports: [
        HttpModule,
    ],
    controllers: [],
    providers: [TinderService],
    exports: [TinderService],
})
export class TinderModule {}

