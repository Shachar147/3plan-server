import {
    BaseEntity,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import {User} from "../user/user.entity";
import {Trip} from "../trip/trip.entity";
import {PackingItem} from "./packing-item.entity";

@Entity()
export class PackingCategory extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne((type) => Trip, (trip) => trip.packing_categories, { eager: false })
    trip: Trip

    @Column()
    tripId: number

    @ManyToOne((type) => User, { eager: false })
    addedByUser: User;

    @Column()
    addedByUserId: number;

    @Column()
    name: string;

    @Column({ nullable: true, default: null })
    icon: string;

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

    @OneToMany((type) => PackingItem, (item) => item.category, { eager: false })
    items: PackingItem[];
}

