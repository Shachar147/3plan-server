import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { User } from "../user/user.entity";
import { Coordinate } from "./dto/create-distance.dto";
import { TextValueObject, TravelMode } from "./common";

@Entity()
@Unique("uniqueFields", ["from", "to", "travel_mode"])
export class Distance extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("jsonb")
  from: Coordinate;

  @Column("jsonb")
  to: Coordinate;

  @Column()
  travel_mode: TravelMode;

  @Column("jsonb")
  distance: TextValueObject;

  @Column("jsonb")
  duration: TextValueObject;

  @Column()
  origin: string;

  @Column()
  destination: string;

  @Column("timestamp", { default: () => "CURRENT_TIMESTAMP" })
  addedAt: Date;

  @ManyToOne((type) => User, (user) => user.added_distances, { eager: false })
  addedBy: User;
}
