import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique, ManyToOne,
} from 'typeorm';
import {User} from "../user/user.entity";

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
}
