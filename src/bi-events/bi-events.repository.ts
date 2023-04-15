import { EntityRepository, Repository } from "typeorm";
import {BIEvents} from "./bi-events.entity";
import {ReportEventDto} from "./dto/report-event.dto";
import {User} from "../user/user.entity";
import {GetEventsFilterDto} from "./dto/get-events-filter.dto";
import {InternalServerErrorException} from "@nestjs/common";

@EntityRepository(BIEvents)
export class BiEventsRepository extends Repository<BIEvents> {

    async reportEvent(dto: ReportEventDto, user: User) {
        const { action, context, isMobile, content } = dto;
        const biEvent = new BIEvents();
        biEvent.user = user;
        biEvent.action = action;
        biEvent.context = context;
        biEvent.isMobile = isMobile;
        biEvent.content = content;
        return await biEvent.save();
    }

    async getEventsByUser(dto: GetEventsFilterDto, user: User, filterByUser?: boolean) {
        const { action, context, isMobile } = dto;
        const query = this.createQueryBuilder("bi_events");

        if (filterByUser) {
            query.where("(bi_events.userId = :userId)", {
                userId: user.id,
            });
        } else {
            query.where("1 = 1");
        }

        if (action) {
            query.andWhere("bi_events.action = :action", { action })
        }

        if (context) {
            query.andWhere("bi_events.context = :context", { context })
        }

        if (isMobile) {
            query.andWhere("bi_events.isMobile = :isMobile", { isMobile })
        }

        try {
            // console.log(query.getSql())
            const result = await query.getMany();
            return result;
        }
        catch (error) {
            console.error(
                `Failed to get trips . Filters: ${JSON.stringify(dto)}"`,
                error.stack
            );
            throw new InternalServerErrorException();
        }
    }
}
