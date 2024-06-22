// point-of-interest.entity.ts
import {
    BaseEntity,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
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

    @Column('jsonb')
    location: {
        latitude: number;
        longitude: number;
    };

    @Column('jsonb')
    rate: {
        quantity: number;
        rating: number;
    };

    // todo remove?
    @Column()
    status: string;

    // todo remove?
    @Column()
    isVerified: boolean;

    @Column()
    price: number;

    @Column()
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
}
