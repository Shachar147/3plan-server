import {
  BaseEntity,
  Column,
  Entity, OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import {Trip} from "../trip/trip.entity";
import {Distance} from "../distance/distance.entity";
import {Backups} from "../backups/backups.entity";
import {Task} from "../task/task.entity";
import {BIEvents} from "../bi-events/bi-events.entity";
import {SharedTrips} from "../shared-trips/shared-trips.entity";
import {TodolistTask} from "../todolist/todolist.entity";
import { SavedCollections } from '../saved-collections/saved-collections.entity';

@Entity()
@Unique(['username'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  salt: string;

  @OneToMany((type) => Trip, (record) => record.user, { eager: false })
  trips: Trip[];

  @OneToMany((type) => Distance, (distance) => distance.addedBy, { eager: false })
  added_distances: Distance[];

  @OneToMany((type) => Task, (task) => task.addedBy, { eager: false })
  added_tasks: Task[];

  @OneToMany((type) => Backups, (backups) => backups.updatedBy, { eager: false })
  backups: Backups[];

  @OneToMany((type) => BIEvents, (event) => event.user, { eager: false })
  events: BIEvents[];

  @Column('timestamp', { nullable: true })
  lastLoginAt: Date;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column( { default: 0 })
  numOfLogins: number;

  @OneToMany((type) => SharedTrips, (sharedTrip) => sharedTrip.invitedByUser, { eager: false })
  sharedTripsByMe: SharedTrips[];

  @OneToMany((type) => SharedTrips, (sharedTrip) => sharedTrip.user, { eager: false })
  sharedTrips: SharedTrips[];

  @OneToMany((type) => TodolistTask, (todoListTask) => todoListTask.addedByUser, { eager: false })
  createdTasks: TodolistTask[]

  @OneToMany(type => SavedCollections, record => record.user, { eager: true })
  saved_collections: SavedCollections[];

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
