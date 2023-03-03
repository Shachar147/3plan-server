import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import {User} from "../user/user.entity";
import {IsNotEmpty} from "class-validator";

@Entity()
export class Backups extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @IsNotEmpty({
        message: 'missing: tripBackup',
    })
    @Column({
        type: 'jsonb'
    })
    tripBackup: 'jsonb';

    @IsNotEmpty({
        message: 'missing: tripId',
    })
    @Column({ nullable: false})
    tripId: number

    @Column()
    requestUrl: string;

    @Column()
    requestMethod: string;

    @Column({
        type: 'jsonb'
    })
    requestPayload: 'jsonb'

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @ManyToOne((type) => User, (user) => user.backups, { eager: false })
    updatedBy: User;
}
