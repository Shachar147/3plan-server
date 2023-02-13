import {HttpService, Injectable} from '@nestjs/common';
import {getTinderServerAddress} from "../../config/server.config";

@Injectable()
export class TinderService {

    constructor(
        private readonly httpService: HttpService
    ) {}

    async login() {
        const username = 'triplan';
        const password = 'Aa783c0fc5-e574-bfee';

        const result = await this.httpService
            .post(`${getTinderServerAddress()}/auth/signin`, { username, password }).toPromise();
        return result?.data?.accessToken;
    }

    async createBulk(data: any[]) {
        const token = await this.login();
        return this.httpService
            .post(`${getTinderServerAddress()}/item/bulk`, data, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Authorization': `Bearer ${token}`
                }
            })
            .toPromise();
    }
}
