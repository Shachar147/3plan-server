import {
    BaseEntity,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Unique, ManyToOne, OneToMany,
} from 'typeorm';
import {User} from "../user/user.entity";
import {Task} from "../task/task.entity";

@Unique(['name', 'userId'])
@Entity()
export class SharedTrips extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    // todo complete
    @ManyToOne((type) => User, (user) => user.sharedByMe, { eager: false })
    sentBy: User;

    @ManyToOne((type) => User, (user) => user.sharedTrips, { eager: false })
    acceptedBy: User;

    @Column()
    userId: number;

    @Column()
    name: string;

    @Column({
        type: 'jsonb'
    })
    dateRange: 'jsonb';

    @Column({
        type: 'jsonb'
    })
    categories: 'jsonb';

    @Column({
        type: 'jsonb'
    })
    allEvents: 'jsonb';

    @Column({
        type: 'jsonb'
    })
    calendarEvents: 'jsonb';

    @Column({
        type: 'jsonb'
    })
    sidebarEvents: 'jsonb';

    @Column()
    calendarLocale: string;

    @Column('timestamp', { nullable: true })
    lastUpdateAt: Date;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @OneToMany((type) => Task, (task) => task.relatedTrip, { eager: true })
    trip_tasks: Task[];

    @Column('boolean', { default: false })
    isLocked: boolean;
}
