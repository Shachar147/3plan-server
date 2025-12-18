import {
    BaseEntity,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from 'typeorm';
import {User} from "../user/user.entity";
import {Trip} from "../trip/trip.entity";
import {PackingCategory} from "./packing-category.entity";

@Entity()
export class PackingItem extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne((type) => Trip, (trip) => trip.packing_items, { eager: false })
    trip: Trip

    @Column()
    tripId: number

    @ManyToOne((type) => PackingCategory, (category) => category.items, { eager: false, nullable: true })
    category: PackingCategory;

    @Column({ nullable: true, default: null})
    categoryId: number;

    @ManyToOne((type) => User, { eager: false })
    addedByUser: User;

    @Column()
    addedByUserId: number;

    @Column()
    title: string;

    @Column({ nullable: true, default: null })
    icon: string;

    @Column({ default: false })
    isPacked: boolean;

    @Column({ type: 'bigint' })
    addedAt: number;

    @Column({ type: 'bigint', nullable: true })
    updatedAt: number;

    @Column({ default: false })
    isDeleted: boolean;

    @Column({ type: 'bigint', nullable: true })
    deletedAt: number;

    @Column({ default: 0 })
    order: number;
}

