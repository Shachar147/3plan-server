import {
    BaseEntity,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Unique, ManyToOne,
} from 'typeorm';
import {User} from "../user/user.entity";
import {Trip} from "../trip/trip.entity";

export const inviteLinkExpiredTimeMinutes = 60;

@Unique(['tripId', 'addedByUserId', 'title', 'isDeleted', 'deletedAt'])
@Entity()
export class TodolistTask extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne((type) => Trip, (trip) => trip.tasks, { eager: false })
    trip: Trip

    @Column()
    tripId: number

    @Column({ nullable: true, default: null})
    eventId: number;

    @ManyToOne((type) => User, (user) => user.createdTasks, { eager: false })
    addedByUser: User;

    @Column()
    addedByUserId: number;

    @Column()
    title: string;

    @Column({ nullable: true, default: null})
    content: string;

    @Column({ type: 'bigint' })
    addedAt: number;

    @Column({ type: 'bigint', nullable: true, default: null })
    mustBeDoneBefore: number;

    @Column()
    status: string;

    @Column({ default: false })
    isDeleted: boolean;

    @Column({ type: 'bigint', nullable: true })
    deletedAt: number;

    @Column({ type: 'bigint', nullable: true })
    updatedAt: number;
}
