import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique} from 'typeorm';
import { User } from '../user/user.entity';

@Unique(['userId', 'name'])
@Unique(['userId', 'destination'])
@Entity()
export class SavedCollections extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => User, user => user.saved_collections, { eager: false })
  user: User;

  @Column()
  userId: number;

  @Column()
  name: string;

  @Column()
  destination: string;
}