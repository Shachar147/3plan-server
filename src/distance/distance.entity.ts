import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { User } from "../user/user.entity";
import { TextValueObject, TravelMode } from "./common";
import {Coordinate} from "../shared/interfaces";

@Entity()
@Unique("uniqueFields", ["from", "to", "travelMode"])
export class Distance extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("jsonb")
  from: Coordinate;

  @Column("jsonb")
  to: Coordinate;

  @Column()
  travelMode: TravelMode;

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
