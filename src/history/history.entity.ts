import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import {User} from "../user/user.entity";
import {IsNotEmpty, IsOptional} from "class-validator";

@Entity()
export class History extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @IsNotEmpty({
        message: 'missing: tripId',
    })
    @Column({ nullable: false})
    tripId: number

    @IsOptional()
    @Column({ nullable: true})
    eventId: number

    @IsOptional()
    @Column({ nullable: true})
    eventName: string

    @Column()
    action: string;

    @Column({
        type: 'jsonb'
    })
    actionParams: 'jsonb'

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @ManyToOne((type) => User, (user) => user.backups, { eager: false })
    updatedBy: User;
}
