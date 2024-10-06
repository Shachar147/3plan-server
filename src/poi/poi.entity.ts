// point-of-interest.entity.ts
import {
    BaseEntity,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class PointOfInterest extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    destination: string;

    @Column('text')
    description: string;

    @Column('simple-array')
    images: string[];

    @Column()
    source: string;

    @Column()
    more_info: string;

    @Column()
    category: string;

    @Column('jsonb', { nullable: true })
    location: {
        latitude: number;
        longitude: number;
    };

    @Column('jsonb', { nullable: true })
    rate: {
        quantity: number;
        rating: number;
    };

    // todo remove?
    @Column({ nullable: true })
    status: string;

    // todo remove?
    @Column()
    isVerified: boolean;

    @Column({ type: 'float', nullable: true })
    price: number;

    @Column({ nullable: true })
    currency: string;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column('timestamp', { nullable: true })
    lastUpdateAt: Date;

    @Column( 'timestamp', { nullable: true })
    deletedAt: Date;

    @ManyToOne(() => User, { eager: false })
    addedBy: User;

    @ManyToOne(() => User, { eager: false })
    updatedBy: User;

    @Column('boolean', { default: false })
    isSystemRecommendation: boolean;

    @Column('text', { nullable: true })
    duration?: string

    @Column('text', { nullable: true })
    backupCategory?: string
}
