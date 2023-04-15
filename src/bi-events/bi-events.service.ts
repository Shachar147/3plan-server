import { Injectable } from '@nestjs/common';
import {ReportEventDto} from "./dto/report-event.dto";
import {User} from "../user/user.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {BiEventsRepository} from "./bi-events.repository";
import {GetEventsFilterDto} from "./dto/get-events-filter.dto";
import {GooglePricesService} from "./google-prices.service";
import {BIEvents} from "./bi-events.entity";

@Injectable()
export class BiEventsService {

    constructor(
        @InjectRepository(BiEventsRepository)
        private biEventsRepository: BiEventsRepository,
        private googlePricesService: GooglePricesService,
    ) {}

    getEventType(event: { action: string }) {
        return event.action;
    }

    async reportEvent(dto: ReportEventDto, user: User) {
        const result = await this.biEventsRepository.reportEvent(dto, user);

        return {
            ...result,
            price: this.googlePricesService.getRequestPrice(this.getEventType(result))
        }
    }

    async getEventsByUser(dto: GetEventsFilterDto, user: User, filterByUser: boolean = true): Promise<any> {
        const results = await this.biEventsRepository.getEventsByUser(dto, user, filterByUser);

        if (dto.includePrice) {
            const resultsWithPrices = results.map((result) => ({
                ...result,
                price: this.googlePricesService.getRequestPrice(this.getEventType(result))
            })).filter((x) => x.price);

            // Use reduce to sum all the prices
            const totalPrice = resultsWithPrices.reduce((accumulator, currentValue) => {
                return accumulator + currentValue.price;
            }, 0);

            return {
                total: resultsWithPrices.length,
                totalPrice,
                results: resultsWithPrices
            };
        }

        return {
            total: results.length,
            results
        };
    }

    async getEventsByAllUsers(dto: GetEventsFilterDto, user: User): Promise<any> {
        return await this.getEventsByUser(dto, user, false);
    }
}
