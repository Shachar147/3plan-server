// point-of-interest.repository.ts
import { EntityRepository, Repository } from 'typeorm';
import { PointOfInterest } from './poi.entity';

@EntityRepository(PointOfInterest)
export class PointOfInterestRepository extends Repository<PointOfInterest> {}
