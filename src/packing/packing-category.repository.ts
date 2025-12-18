import {Injectable, InternalServerErrorException, Logger} from "@nestjs/common";
import {EntityRepository, Repository} from "typeorm";
import {PackingCategory} from "./packing-category.entity";
import {User} from "../user/user.entity";
import {Trip} from "../trip/trip.entity";

@Injectable()
@EntityRepository(PackingCategory)
export class PackingCategoryRepository extends Repository<PackingCategory> {
    private logger = new Logger("PackingCategoryRepository");

    async createCategory(trip: Trip, name: string, icon: string = undefined, order: number = 0, addedByUser: User): Promise<PackingCategory> {
        const category = new PackingCategory();
        category.trip = trip;
        category.tripId = trip.id;
        category.name = name;
        category.icon = icon;
        category.order = order;
        category.addedByUser = addedByUser;
        category.addedByUserId = addedByUser.id;
        category.addedAt = parseInt((new Date().getTime()/1000).toString());

        try {
            await category.save();
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException();
        }

        return category;
    }
}

