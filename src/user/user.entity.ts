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

  @OneToMany((type) => Trip, (record) => record.user, { eager: true })
  trips: Trip[];

  @OneToMany((type) => Distance, (distance) => distance.addedBy, { eager: true })
  added_distances: Distance[];

  @OneToMany((type) => Backups, (backups) => backups.updatedBy, { eager: true })
  backups: Backups[];

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
