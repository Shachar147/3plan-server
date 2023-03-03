import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import {User} from "../user/user.entity";
import {Coordinate} from "./dto/create-distance.dto";

export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";

export interface TextValueObject {
    text: string;
    value: string;
}

@Entity()
@Unique("uniqueFields", ["from" , "to" , "travel_mode"])
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

    @Column({ nullable: false })
    addedAt: number;

    @ManyToOne((type) => User, (user) => user.added_distances, { eager: false })
    addedBy: User;

}
