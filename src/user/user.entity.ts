import {
  BaseEntity,
  Column,
  Entity, ManyToOne, OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import {Trip} from "../trip/trip.entity";
import {Distance} from "../distance/distance.entity";
import {Backups} from "../backups/backups.entity";
import {Task} from "../task/task.entity";
import {BIEvents} from "../bi-events/bi-events.entity";

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

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
