import {BadRequestException, ConflictException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "../user/user.entity";
import {PackingItemRepository} from "./packing-item.repository";
import {PackingCategoryRepository} from "./packing-category.repository";
import {getRepository} from "typeorm";
import {PackingItem} from "./packing-item.entity";
import {PackingCategory} from "./packing-category.entity";
import {Trip} from "../trip/trip.entity";
import {SharedTrips} from "../shared-trips/shared-trips.entity";
import {CreatePackingItemDto} from "./dto/create-packing-item.dto";
import {UpdatePackingItemDto} from "./dto/update-packing-item.dto";
import {CreatePackingCategoryDto} from "./dto/create-packing-category.dto";
import {UpdatePackingCategoryDto} from "./dto/update-packing-category.dto";

@Injectable()
export class PackingService {

    private logger = new Logger("PackingService");
    constructor(
        @InjectRepository(PackingItemRepository)
        private packingItemRepository: PackingItemRepository,
        @InjectRepository(PackingCategoryRepository)
        private packingCategoryRepository: PackingCategoryRepository,
    ) {}

    async getUserSharedTrips(userId: number): Promise<number[]> {
        const sharedTripRepository = getRepository(SharedTrips);
        const shared_query = sharedTripRepository.createQueryBuilder("shared-trips")
            .where("shared-trips.userId = :userId", {userId})
            .andWhere('shared-trips.isDeleted = :isDeleted', {isDeleted: false});
        const sharedTrips = await shared_query.getMany();
        return sharedTrips.map((x) => x.tripId);
    }

    async getTripIfHasPermissions(tripId: number, userId: number): Promise<Trip> {
        tripId = Number(tripId);
        const tripRepository = getRepository(Trip);
        const query = tripRepository.createQueryBuilder("trip")
            .where("trip.userId = :userId", { userId })
            .andWhere('trip.id = :id', { id: tripId });
        const trip = await query.getOne();

        if (!trip) {
            const tripIds = await this.getUserSharedTrips(userId);
            if (tripIds.includes(tripId)){
                const query = tripRepository.createQueryBuilder("trip")
                    .where('trip.id = :id', { id: tripId });
                return await query.getOne();
            }
        }

        if (!trip) {
            throw new NotFoundException(`Trip #${tripId} not found`);
        }
        return trip;
    }

    // PackingItem methods
    async createItem(tripId: number, title: string, icon: string | null | undefined = undefined, categoryId: number | null | undefined = undefined, isPacked: boolean = false, order: number = 0, addedByUser: User): Promise<PackingItem> {
        const trip = await this.getTripIfHasPermissions(tripId, addedByUser.id);

        // Validate category if provided
        if (categoryId != null && categoryId !== undefined) {
            const category = await this.getCategoryById(categoryId, addedByUser);
            if (category.tripId !== tripId) {
                throw new BadRequestException(`Category #${categoryId} does not belong to trip #${tripId}`);
            }
        }

        return await this.packingItemRepository.createItem(trip, title, icon || undefined, categoryId || undefined, isPacked, order, addedByUser);
    }

    async getItemsByTripId(tripId: number, user: User) {
        const trip = await this.getTripIfHasPermissions(tripId, user.id);

        const where = {
            deletedAt: null,
            isDeleted: false,
            tripId: tripId,
        };

        return await this.packingItemRepository.find({
            where: where,
            order: { order: 'ASC', isPacked: 'ASC' }
        });
    }

    async getItemById(id: number, user: User): Promise<PackingItem> {
        const where = {
            deletedAt: null,
            isDeleted: false,
            id
        };

        const found = await this.packingItemRepository.findOne({
            where: where
        });

        if (!found){
            throw new NotFoundException(`Packing Item #${id} not found`);
        }

        // to validate current user has permissions on this item
        const trip = await this.getTripIfHasPermissions(found.tripId, user.id);

        return found;
    }

    async deleteItem(id: number, user: User) {
        const found = await this.getItemById(id, user);

        found.isDeleted = true;
        found.deletedAt = parseInt((new Date().getTime()/1000).toString());
        await found.save();

        return {
            "itemId": found.id,
            "tripId": found.tripId,
            "status": "deleted"
        }
    }

    async updateItem(id: number, params: UpdatePackingItemDto, user: User) {
        const found = await this.getItemById(id, user);
        const { title, icon, categoryId, isPacked, order } = params;

        let updates = 0;
        if (title && found.title !== title) {
            found.title = title;
            updates++;
        }

        if (icon !== undefined && found.icon !== icon) {
            found.icon = icon ? icon : null;
            updates++;
        }

        if (categoryId !== undefined) {
            // Handle null (uncategorized) vs number (category ID)
            const newCategoryId = categoryId === null ? null : categoryId;
            
            // Only update if the value actually changed
            if (found.categoryId !== newCategoryId) {
                // Validate category if provided (not null)
                if (newCategoryId !== null) {
                    const category = await this.getCategoryById(newCategoryId, user);
                    if (category.tripId !== found.tripId) {
                        throw new BadRequestException(`Category #${newCategoryId} does not belong to trip #${found.tripId}`);
                    }
                }
                found.categoryId = newCategoryId;
                updates++;
            }
        }

        if (isPacked !== undefined && found.isPacked !== isPacked) {
            found.isPacked = isPacked;
            updates++;
        }

        if (order !== undefined && found.order !== order) {
            found.order = order;
            updates++;
        }

        if (updates) {
            found.updatedAt = parseInt((new Date().getTime() / 1000).toString());
            await found.save();
        }
        return { item: found, updates };
    }

    // PackingCategory methods
    async createCategory(tripId: number, name: string, icon: string | null | undefined = undefined, order: number = 0, addedByUser: User): Promise<PackingCategory> {
        const trip = await this.getTripIfHasPermissions(tripId, addedByUser.id);

        // Check if category with same name already exists
        const existing = await this.packingCategoryRepository.findOne({
            where: {
                tripId: tripId,
                name: name,
                isDeleted: false,
                deletedAt: null
            }
        });

        if (existing) {
            throw new ConflictException(`Category "${name}" already exists for trip "${trip.name}"`);
        }

        return await this.packingCategoryRepository.createCategory(trip, name, icon || undefined, order, addedByUser);
    }

    async getCategoriesByTripId(tripId: number, user: User) {
        const trip = await this.getTripIfHasPermissions(tripId, user.id);

        const where = {
            deletedAt: null,
            isDeleted: false,
            tripId: tripId,
        };

        return await this.packingCategoryRepository.find({
            where: where,
            order: { order: 'ASC' }
        });
    }

    async getCategoryById(id: number, user: User): Promise<PackingCategory> {
        const where = {
            deletedAt: null,
            isDeleted: false,
            id
        };

        const found = await this.packingCategoryRepository.findOne({
            where: where
        });

        if (!found){
            throw new NotFoundException(`Packing Category #${id} not found`);
        }

        // to validate current user has permissions on this category
        const trip = await this.getTripIfHasPermissions(found.tripId, user.id);

        return found;
    }

    async deleteCategory(id: number, user: User) {
        const found = await this.getCategoryById(id, user);

        // Move all items in this category to uncategorized (set categoryId to null)
        const items = await this.packingItemRepository.find({
            where: {
                categoryId: id,
                isDeleted: false,
                deletedAt: null
            }
        });

        for (const item of items) {
            item.categoryId = null;
            item.updatedAt = parseInt((new Date().getTime() / 1000).toString());
            await item.save();
        }

        found.isDeleted = true;
        found.deletedAt = parseInt((new Date().getTime()/1000).toString());
        await found.save();

        return {
            "categoryId": found.id,
            "tripId": found.tripId,
            "status": "deleted",
            "itemsMoved": items.length
        }
    }

    async updateCategory(id: number, params: UpdatePackingCategoryDto, user: User) {
        const found = await this.getCategoryById(id, user);
        const { name, icon, order } = params;

        let updates = 0;
        if (name && found.name !== name) {
            // Check if another category with same name exists
            const existing = await this.packingCategoryRepository.findOne({
                where: {
                    tripId: found.tripId,
                    name: name,
                    isDeleted: false,
                    deletedAt: null,
                }
            });

            if (existing && existing.id !== id) {
                throw new ConflictException(`Category "${name}" already exists for this trip`);
            }

            found.name = name;
            updates++;
        }

        if (icon !== undefined && found.icon !== icon) {
            found.icon = icon ? icon : null;
            updates++;
        }

        if (order !== undefined && found.order !== order) {
            found.order = order;
            updates++;
        }

        if (updates) {
            found.updatedAt = parseInt((new Date().getTime() / 1000).toString());
            await found.save();
        }
        return { category: found, updates };
    }
}

