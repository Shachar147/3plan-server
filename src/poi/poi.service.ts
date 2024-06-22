import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PointOfInterestRepository } from './poi.repository';
import { PointOfInterest } from './poi.entity';
import { User } from '../user/user.entity';

@Injectable()
export class PointOfInterestService {
    private readonly logger = new Logger(PointOfInterestService.name);

    constructor(
        @InjectRepository(PointOfInterestRepository)
        private pointOfInterestRepository: PointOfInterestRepository,
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
    async upsertAll(items: Partial<PointOfInterest>[], user: User): Promise<void> {
        for (const item of items) {
            // Find existing POI based on the unique combination of name, source, and more_info
            const existingPoi = await this.pointOfInterestRepository.findOne({
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
                await this.pointOfInterestRepository.save(existingPoi);
            } else {
                // Create a new POI
                this.logger.log(`Creating new POI: ${item.name} (Source: ${item.source}, URL: ${item.more_info})`);
                const newPoi = this.pointOfInterestRepository.create({ ...item, addedBy: user });
                await this.pointOfInterestRepository.save(newPoi);
            }
        }
    }
}
