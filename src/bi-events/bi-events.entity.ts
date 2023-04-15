import {
    BaseEntity,
    Column,
    Entity, Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import { User } from "../user/user.entity";

@Entity()
@Unique("uniqueBIFields", ["user", "action", "addedAt"])
export class BIEvents extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column()
    action: string;

    @Column({ nullable: true})
    context: string;

    @Column("jsonb", { nullable: true})
    content: object

    @Index()
    @Column()
    isMobile: boolean;

    @Column("timestamp", { default: () => "CURRENT_TIMESTAMP" })
    addedAt: Date;

    @Index()
    @ManyToOne((type) => User, (user) => user.events, { eager: false })
    user: User;
}
