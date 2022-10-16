import { HttpService } from '@nestjs/common';
export declare class BasketballreferenceService {
    private readonly http;
    constructor(http: HttpService);
    get3PointShooters(): Promise<any[]>;
}
