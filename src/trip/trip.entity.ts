import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique, ManyToOne, OneToMany,
} from 'typeorm';
import {User} from "../user/user.entity";
import {Task} from "../task/task.entity";
import {TodolistTask} from "../todolist/todolist.entity";

@Unique(['name', 'userId'])
@Entity()
export class Trip extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => User, (user) => user.trips, { eager: false })
  user: User;

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

  // background tasks (for distance calculation)
  @OneToMany((type) => Task, (task) => task.relatedTrip, { eager: true })
  trip_tasks: Task[];

  @Column('boolean', { default: false })
  isLocked: boolean;

  @Column('boolean', { default: false })
  isHidden: boolean;

  // todolist tasks
  @OneToMany((type) => TodolistTask, (task) => task.trip, { eager: true })
  todolist_tasks: Task[];

  @Column({
    type: 'jsonb',
    default: []
  })
  destinations: 'jsonb';
}
