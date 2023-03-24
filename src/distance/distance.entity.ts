import {
  BaseEntity,
  Column,
  Entity, Index,
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

  @Index()
  @Column()
  from: string;

  @Index()
  @Column()
  to: string;

  @Column()
  travelMode: TravelMode;

  @Column({ type: "jsonb", nullable: true })
  distance: TextValueObject;

  @Column({ type: "jsonb", nullable: true })
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
