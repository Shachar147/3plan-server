import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import { User } from "../user/user.entity";
import {Coordinate} from "../shared/interfaces";
import {Trip} from "../trip/trip.entity";

export enum TaskStatusType {
    pending = 'pending',
    inProgress = 'inProgress',
    failed = 'failed',
    succeeded = 'succeeded'
}

@Entity()
export class TaskStatus extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("jsonb")
    taskInfo: object

    @Column()
    status: TaskStatusType;

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
