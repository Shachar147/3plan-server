import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PointOfInterestRepository } from './poi.repository';
import { PointOfInterest } from './poi.entity';
import { User } from '../user/user.entity';
import {SearchResults, SearchSuggestion} from "./utils/interfaces";
import {Brackets} from "typeorm";

@Injectable()
export class PointOfInterestService {
    private readonly logger = new Logger(PointOfInterestService.name);

    constructor(
        @InjectRepository(PointOfInterestRepository)
        public pointOfInterestRepository: PointOfInterestRepository,
    ) {}

    async createPointOfInterest(data: Partial<PointOfInterest>, user: User): Promise<PointOfInterest> {
        const pointOfInterest = this.pointOfInterestRepository.create({ ...data, addedBy: user });
        return this.pointOfInterestRepository.save(pointOfInterest);
    }

    async getAllPointsOfInterest(): Promise<PointOfInterest[]> {
        return this.pointOfInterestRepository.find();
    }

    async getPointOfInterestById(id: number): Promise<PointOfInterest> {
        return this.pointOfInterestRepository.findOne(id);
    }

    async updatePointOfInterest(id: number, data: Partial<PointOfInterest>, user: User): Promise<PointOfInterest> {
        const pointOfInterest = await this.getPointOfInterestById(id);
        Object.assign(pointOfInterest, data, { updatedBy: user });
        return this.pointOfInterestRepository.save(pointOfInterest);
    }

    async deletePointOfInterest(id: number, user: User): Promise<void> {
        const pointOfInterest = await this.getPointOfInterestById(id);
        pointOfInterest.deletedAt = new Date();
        pointOfInterest.updatedBy = user;
        await this.pointOfInterestRepository.save(pointOfInterest);
    }

    /**
     * Upserts an array of points of interest (POIs).
     * @param items - Array of POIs to be added or updated.
     * @param user - The user performing the operation.
     * @returns A promise that resolves when the upsert operation is complete.
     */
    async upsertAll(items: Partial<PointOfInterest>[], user: User): Promise<PointOfInterest[]> {
        const results = []
        for (const item of items) {
            // Find existing POI based on the unique combination of name, source, and more_info
            let existingPoi = await this.pointOfInterestRepository.findOne({
                where: {
                    name: item.name,
                    source: item.source,
                    more_info: item.more_info,
                },
            });

            if (existingPoi) {
                // Update the existing POI
                this.logger.log(`Updating POI: ${item.name} (Source: ${item.source}, URL: ${item.more_info})`);
                Object.assign(existingPoi, item, { updatedBy: user });
                const poi = await this.pointOfInterestRepository.save(existingPoi);
                results.push(poi);
            } else {
                // Create a new POI
                this.logger.log(`Creating new POI: ${item.name} (Source: ${item.source}, URL: ${item.more_info})`);
                const newPoi = this.pointOfInterestRepository.create({ ...item, addedBy: user });
                const poi = await this.pointOfInterestRepository.save(newPoi);
                results.push(poi);
            }
        }
        return results;
    }

    // Custom method to get the count of rows for each source for a given destination
    async getCountBySourceForDestination(destination: string): Promise<Record<string, number>> {
        const query = this.pointOfInterestRepository.createQueryBuilder('poi')
            .select('poi.source')
            .addSelect('COUNT(poi.id)', 'count')
            .where('poi.destination = :destination', { destination })
            .groupBy('poi.source');

        const result = await query.getRawMany();

        const countBySource: Record<string, number> = {};
        result.forEach(row => {
            countBySource[row["poi_source"]] = parseInt(row.count, 10);
        });

        return countBySource;
    }

    async getPointsOfInterestByDestination(destination: string, page: number, limit: number = 50): Promise<SearchResults> {
        // Fetch the points of interest based on the given destination, page, and limit
        const pointsOfInterest = await this.pointOfInterestRepository.find({
            where: { destination },
            skip: (page - 1) * limit,
            take: limit,
        });

        // if (page == 1 && pointsOfInterest.length == 0){
        //     return await this.getPointsOfInterestByName(destination, page, limit)
        // }

        // Check if there are more results for the next page
        const totalPointsOfInterest = await this.pointOfInterestRepository.count({ where: { destination } });
        const isFinished = (page * limit) >= totalPointsOfInterest;
        const nextPage = isFinished ? null : page + 1;

        // Return the formatted response
        return {
            results: pointsOfInterest,
            isFinished,
            nextPage,
            source: "Local"
        };
    }

    // async getPointsOfInterestByName(name: string, page: number, limit: number = 50): Promise<SearchResults> {
    //     // Fetch the points of interest based on the given destination, page, and limit
    //     const pointsOfInterest = await this.pointOfInterestRepository.find({
    //         where: { name },
    //         skip: (page - 1) * limit,
    //         take: limit,
    //     });
    //
    //     // Check if there are more results for the next page
    //     const totalPointsOfInterest = await this.pointOfInterestRepository.count({ where: { name } });
    //     const isFinished = (page * limit) >= totalPointsOfInterest;
    //     const nextPage = isFinished ? null : page + 1;
    //
    //     // Return the formatted response
    //     return {
    //         results: pointsOfInterest,
    //         isFinished,
    //         nextPage,
    //         source: "Local"
    //     };
    // }

    async getFeedItems(): Promise<SearchResults> {
        const pointsOfInterest = await this.pointOfInterestRepository
            .createQueryBuilder('poi')
            .where('poi.isSystemRecommendation = true')
            .orWhere('poi.rate IS NOT NULL AND CAST(poi.rate AS jsonb) ->> \'rating\' = :rating AND CAST(poi.rate AS jsonb) ->> \'quantity\' >= :quantity', { rating: '5', quantity: 50 })
            .orderBy('poi.isSystemRecommendation', 'DESC')
            .addOrderBy('RANDOM()')
            .take(12)
            .getMany();

        // Return the formatted response
        return {
            results: pointsOfInterest,
            isFinished: true,
            nextPage: null,
            source: 'Local',
        };
    }

    async getSearchSuggestions(searchKeyword: string): Promise<SearchSuggestion[]> {
        const pointsOfInterest = await this.pointOfInterestRepository
            .createQueryBuilder('poi')
            .andWhere(
                new Brackets((qb) => {
                    qb.where('poi.name ILIKE :searchKeyword', { searchKeyword: `%${searchKeyword}%` })
                    .orWhere('poi.destination ILIKE :searchKeyword', { searchKeyword: `%${searchKeyword}%` })
                    .orWhere('poi.description ILIKE :searchKeyword', { searchKeyword: `%${searchKeyword}%` });
                })
            ).andWhere(
                new Brackets((qb) => {
                    qb.where('poi.isSystemRecommendation IS true')
                        .orWhere('poi.rate IS NOT NULL AND (CAST(poi.rate AS jsonb) ->> \'rating\')::float > 4')
                })
            )
            .orderBy('poi.isSystemRecommendation', 'DESC')
            .addOrderBy('CAST(poi.rate->>\'rating\' AS FLOAT)', 'DESC')
            .take(30)
            .getMany();

        const suggestions: SearchSuggestion[] = [];
        pointsOfInterest.forEach((p) => {
            suggestions.push({
                "id": p.id,
                "name": p.name,
                "category": p.category || 'CATEGORY.GENERAL',
                "destination": p.destination,
                "image": p.images?.[0]
            })
        })
        return suggestions;
    }
}
