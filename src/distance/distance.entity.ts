import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import { IsOptional } from "class-validator";
import {User} from "../user/user.entity";

@Entity()
@Unique("uniqueFields", ["from_lat", "from_lng" , "to_lat" , "to_lng"])
export class Distance extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    from_lat: string;

    @Column()
    from_lng: string;

    @Column()
    to_lat: string;

    @Column()
    to_lng: number;

    @Column()
    travel_mode: string;

    @Column()
    distance: string;

    @Column()
    duration: string;

    @Column()
    from: string;

    @Column()
    to: string;

    @Column()
    distance_value: string;

    @ManyToOne((type) => User, (user) => user.added_distances, { eager: false })
    addedBy: User;

}
