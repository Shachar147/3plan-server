import {Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PointOfInterestRepository } from './poi.repository';
import { PointOfInterest } from './poi.entity';
import { User } from '../user/user.entity';
import {SearchResults, SearchSuggestion} from "./utils/interfaces";
import {Brackets, ILike, Like} from "typeorm";
import {extractCategory} from "./utils/utils";
import {shuffle} from "../shared/utils";

export type UpsertAllResponse = { results: PointOfInterest[], totalAdded: number, totalUpdated: number};

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
        return this.pointOfInterestRepository.find({});
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
    async upsertAll(items: Partial<PointOfInterest>[], user: User): Promise<UpsertAllResponse> {
        const results = [];
        let totalAdded = 0;
        let totalUpdated = 0;
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
                totalUpdated += 1;
            } else {
                // Create a new POI
                this.logger.log(`Creating new POI: ${item.name} (Source: ${item.source}, URL: ${item.more_info})`);
                const newPoi = this.pointOfInterestRepository.create({ ...item, addedBy: user });
                const poi = await this.pointOfInterestRepository.save(newPoi);
                results.push(poi);
                totalAdded += 1;
            }
        }
        return { results, totalUpdated, totalAdded };
    }

    /**
     * Upserts an array of points of interest (POIs).
     * @param items - Array of POIs to be added or updated.
     * @param user - The user performing the operation.
     * @returns A promise that resolves when the upsert operation is complete.
     */
    async upsertAllIds(items: Partial<PointOfInterest>[], user: User): Promise<PointOfInterest[]> {
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

                if (existingPoi.name.includes("|")) {
                    item.name = existingPoi.name; // to prevent it from overriding the name.
                }

                if (existingPoi.description.includes("|")) {
                    item.description = existingPoi.description; // to prevent it from overriding the description.
                }
                Object.assign(existingPoi, item, { updatedBy: user });
                const poi = await this.pointOfInterestRepository.save(existingPoi);
                item.id = poi.id;
                results.push(item);
            } else {
                // Create a new POI
                this.logger.log(`Creating new POI: ${item.name} (Source: ${item.source}, URL: ${item.more_info})`);
                const newPoi = this.pointOfInterestRepository.create({ ...item, addedBy: user });
                const poi = await this.pointOfInterestRepository.save(newPoi);
                item.id = poi.id;
                results.push(item);
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
            order: {
                isSystemRecommendation: "DESC" // System recommendations first
            },
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

    async getSearchResults(searchKeyword: string, page: number, limit: number = 50): Promise<SearchResults> {
        // Step 1: Count total items that match the search criteria (both recommended and non-recommended)
        const total = await this.pointOfInterestRepository.count({
            where: [
                { name: Like(`%${searchKeyword}%`) },
                { description: Like(`%${searchKeyword}%`) },
                { destination: Like(`%${searchKeyword}%`) },
                { source: Like(`%${searchKeyword}%`) }
            ]
        });

        const totalPages = Math.ceil(total / limit);

        // Step 2: Fetch the points of interest based on the searchKeyword, page, and limit
        // Order by isSystemRecommendation first (true comes first), then apply pagination
        const pointsOfInterest = await this.pointOfInterestRepository.find({
            where: [
                { name: ILike(`%${searchKeyword}%`) },
                { description: ILike(`%${searchKeyword}%`) },
                { destination: ILike(`%${searchKeyword}%`) },
                { source: ILike(`%${searchKeyword}%`) }
            ],
            order: {
                isSystemRecommendation: "DESC" // System recommendations first
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Step 3: Check if there are more results for the next page
        const isFinished = (page * limit) >= total;
        const nextPage = isFinished ? null : page + 1;

        // Step 4: Return the formatted response
        return {
            total,
            totalPages,
            results: pointsOfInterest,
            isFinished,
            nextPage,
            source: "Local",
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

    async getSystemRecommendations(page?: number): Promise<SearchResults> {

        const pageSize = page ? 30 : 8;

        let pointsOfInterest;
        if (page){
            pointsOfInterest = await this.pointOfInterestRepository
                .createQueryBuilder('poi')
                .where('poi.isSystemRecommendation = true')
                .andWhere('poi.deletedAt IS NULL')
                .skip((page-1) * pageSize)
                .take(pageSize)
                .orderBy("poi.id", "DESC")
                .getMany();

            pointsOfInterest = shuffle(pointsOfInterest);
        }
        else {
            pointsOfInterest = await this.pointOfInterestRepository
                .createQueryBuilder('poi')
                .where('poi.isSystemRecommendation = true')
                .andWhere('poi.deletedAt IS NULL')
                .orderBy('RANDOM()')
                .take(pageSize)
                .getMany();
        }

        // Return the formatted response
        const isFinished = page ? pointsOfInterest.length != pageSize : true;
        return {
            results: pointsOfInterest,
            isFinished,
            nextPage: page && !isFinished ? page+1 : null,
            source: 'Local',
        };
    }

    async getFeedItems(withoutSystemRecommendations: number, page?: number): Promise<SearchResults> {
        let query = this.pointOfInterestRepository
            .createQueryBuilder('poi')
            .where('poi.rate IS NOT NULL AND CAST(poi.rate AS jsonb) ->> \'rating\' = :rating AND CAST(poi.rate AS jsonb) ->> \'quantity\' >= :quantity', { rating: '5', quantity: 50 });

        if (withoutSystemRecommendations == 0){
            query = query.orWhere('poi.isSystemRecommendation = true');
        } else {
            query = query.andWhere('poi.isSystemRecommendation = false');
        }

        let pointsOfInterest;

        if (page){
            pointsOfInterest = await query
                .orderBy('poi.isSystemRecommendation', 'DESC')
                .skip((page-1) * 12)
                .take(12)
                .getMany();

            pointsOfInterest = shuffle(pointsOfInterest);
        } else {
            pointsOfInterest = await query.orderBy('poi.isSystemRecommendation', 'DESC')
                .addOrderBy('RANDOM()')
                .take(12)
                .getMany();
        }

        const isFinished = page ? pointsOfInterest.length != 12 : true;
        return {
            results: pointsOfInterest,
            isFinished,
            nextPage: page && !isFinished ? page+1 : null,
            source: 'Local',
        };
    }

    async getSearchSuggestions(searchKeyword: string): Promise<SearchSuggestion[]> {
        const pointsOfInterest = await this.pointOfInterestRepository
            .createQueryBuilder('poi')
            .where([
                { name: ILike(`%${searchKeyword}%`) },
                { description: ILike(`%${searchKeyword}%`) },
                { destination: ILike(`%${searchKeyword}%`) },
                { source: ILike(`%${searchKeyword}%`) }
            ])
            .orderBy('poi.isSystemRecommendation', 'DESC') // Prioritize system recommendations
            .addOrderBy(
                `COALESCE(CAST(poi.rate->>'rating' AS FLOAT), 0)`, 'DESC' // Fallback to 0 if rating is not available
            )
            .take(30)
            .getMany();

        // const pointsOfInterest = await this.pointOfInterestRepository
        //     .createQueryBuilder('poi')
        //     .andWhere(
        //         new Brackets((qb) => {
        //             qb.where('poi.name ILIKE :searchKeyword', { searchKeyword: `%${searchKeyword}%` })
        //             .orWhere('poi.destination ILIKE :searchKeyword', { searchKeyword: `%${searchKeyword}%` })
        //             .orWhere('poi.description ILIKE :searchKeyword', { searchKeyword: `%${searchKeyword}%` })
        //             .orWhere(':searchKeyword ILIKE poi.source', { searchKeyword: `${searchKeyword}` });
        //         })
        //     )
        //     .orderBy('poi.isSystemRecommendation', 'DESC')
        //     .addOrderBy(
        //         `COALESCE(CAST(poi.rate->>'rating' AS FLOAT), 0)`, 'DESC'
        //     )
        //     .take(30)
        //     .getMany();

        const suggestions: SearchSuggestion[] = [];
        pointsOfInterest.forEach((p) => {
            const category = p.category || 'CATEGORY.GENERAL';
            const suggestion = {
                "id": p.id,
                "name": p.name,
                "category": category,
                "destination": p.destination,
                "image": p.images?.[0],
            };
            if (p.rate?.rating){
                suggestion["rating"] = p.rate.rating;
                if (p.rate.rating.toString().length > 3) {
                    suggestion["rating"] = p.rate.rating.toFixed(2);
                }
            }
            suggestions.push(suggestion);
        })
        return suggestions;
    }

    async fixCategories(user: User, isDryRun: boolean = true) {
        if (user.username !== 'Shachar'){
            throw new UnauthorizedException();
        }

        this.logger.log("getting all POIs")
        const allPois = await this.getAllPointsOfInterest();
        this.logger.log(`got ${allPois.length} POIs`);

        const diffs = [];
        const diffsByCategories = {};
        let updatedRows = 0;

        for (let i=0; i< allPois.length; i++){
            const row = allPois[i];
            if (row.source == "Dubai.co.il") {
                continue;
            }
            if (row.isSystemRecommendation) {
                continue;
            }
            const existingCategory = row.category || 'CATEGORY.GENERAL';
            const newCategory = extractCategory([
                row.name,
                row.description
            ]) || 'CATEGORY.GENERAL';

            if (existingCategory != newCategory) {
                const diffByCategory = `${existingCategory} -> ${newCategory}`;
                diffsByCategories[diffByCategory] = diffsByCategories[diffByCategory] || [];
                const diff = `${row.name} | ${diffByCategory}`;
                this.logger.log(diff);
                diffs.push(diff);
                // diffsByCategories[diffByCategory].push(row.name + "     -      " + row.description);
                diffsByCategories[diffByCategory].push(row.name);

                // i = allPois.length+1;

                const percents = Math.round(((i+1) / allPois.length) * 100);
                if (percents % 5 === 0){
                    this.logger.log(`finished ${percents}% - ${i+1}/${allPois.length}`);
                }

                if (!isDryRun) {
                    this.logger.log("applying change...");
                    if (!row.backupCategory) {
                        row.backupCategory = row.category || "CATEGORY.GENERAL";
                    }
                    row.category = newCategory;
                    await row.save();
                    updatedRows++;
                    // if (updatedRows) {
                    //     i = allPois.length + 1;
                    // }
                    this.logger.log(`saved! so far ${updatedRows} rows modified`);
                }
            }
        }

        // const relevantKeys = Object.keys(diffsByCategories).filter((k) => k.endsWith(" -> CATEGORY.GENERAL") || k.endsWith(" -> CATEGORY.DESSERTS"));
        // const k = {};
        // relevantKeys.forEach((_k) => {
        //     k[_k] = diffsByCategories[_k];
        // })

        return {
            diffs: diffsByCategories,
            totalRows: allPois.length,
            totalDiffs: diffs.length,
            totalUpdated: updatedRows
        };
    }

    async getPointsOfInterestByCategory(user: User){
        if (user.username !== 'Shachar'){
            throw new UnauthorizedException();
        }

        const allPois = await this.getAllPointsOfInterest();
        const result: Record<string, any> = {};
        allPois.forEach((poi) => {
            const category = poi.category || "CATEGORY.GENERAL";
            result[category] = result[category] || [];
            result[category].push(poi.name);
        });

        const totals = {};
        Object.keys(result).forEach((categoryName) => {
            totals[categoryName] = result[categoryName].length;
        })

        result["totals"] = totals;

        return result;
    }
}
