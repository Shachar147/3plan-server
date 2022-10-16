import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { PlayerPosition } from '../player-position.enum';
export declare class PlayerPositionValidationPipe implements PipeTransform {
    private logger;
    readonly allowedValues: PlayerPosition[];
    transform(value: any, metadata: ArgumentMetadata): any;
    private isValid;
}
