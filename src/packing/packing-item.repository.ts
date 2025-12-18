import {Injectable, InternalServerErrorException, Logger} from "@nestjs/common";
import {EntityRepository, Repository} from "typeorm";
import {PackingItem} from "./packing-item.entity";
import {User} from "../user/user.entity";
import {Trip} from "../trip/trip.entity";

@Injectable()
@EntityRepository(PackingItem)
export class PackingItemRepository extends Repository<PackingItem> {
    private logger = new Logger("PackingItemRepository");

    async createItem(trip: Trip, title: string, icon: string = undefined, categoryId: number = undefined, isPacked: boolean = false, order: number = 0, addedByUser: User): Promise<PackingItem> {
        const item = new PackingItem();
        item.trip = trip;
        item.tripId = trip.id;
        item.title = title;
        item.icon = icon;
        item.categoryId = categoryId;
        item.isPacked = isPacked;
        item.order = order;
        item.addedByUser = addedByUser;
        item.addedByUserId = addedByUser.id;
        item.addedAt = parseInt((new Date().getTime()/1000).toString());

        try {
            await item.save();
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException();
        }

        return item;
    }
}

