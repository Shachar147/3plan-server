import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../user/user.entity";
import {Trip} from "../trip/trip.entity";
import {TaskStatus} from "./common";

@Entity()
export class Task extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("jsonb")
    taskInfo: object

    @Column()
    status: TaskStatus;

    @Column("jsonb")
    detailedStatus: object;

    @Column('decimal', { nullable: true })
    progress: number

    @Column("timestamp", { default: () => "CURRENT_TIMESTAMP" })
    addedAt: Date;

    @Column("timestamp", { nullable: true})
    lastUpdateAt: Date;

    @ManyToOne((type) => User, (user) => user.added_tasks, { eager: false })
    addedBy: User;

    @ManyToOne((type) => Trip, (trip) => trip.trip_tasks, { eager: false })
    relatedTrip: Trip;
}
