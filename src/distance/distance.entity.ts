import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import {User} from "../user/user.entity";

@Entity()
@Unique("uniqueFields", ["from" , "to" , "travel_mode"])
export class Distance extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("jsonb")
    from: object;

    @Column("jsonb")
    to: object;

    @Column()
    travel_mode: string;

    @Column()
    distance: string;

    @Column()
    duration: string;

    @Column()
    origin: string;

    @Column()
    destination: string;

    @Column({ nullable: false })
    addedAt: number;

    @ManyToOne((type) => User, (user) => user.added_distances, { eager: false })
    addedBy: User;

}
