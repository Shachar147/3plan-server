import { HttpService } from '@nestjs/common';
export declare class ESPNService {
    private readonly http;
    constructor(http: HttpService);
    getInjuredPlayers(): Promise<any[]>;
    reformatDate(date: any): string;
    _collectInjuredPlayerdetails(page: any): {};
}
