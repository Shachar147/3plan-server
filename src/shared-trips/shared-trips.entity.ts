import {
    BaseEntity,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Unique, ManyToOne,
} from 'typeorm';
import {User} from "../user/user.entity";

export const inviteLinkExpiredTimeMinutes = 60;

@Unique(['tripId', 'userId', 'canRead', 'canWrite', 'isDeleted', 'deletedAt'])
@Entity()
export class SharedTrips extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tripId: number

    @ManyToOne((type) => User, (user) => user.sharedTripsByMe, { eager: false })
    invitedByUser: User;

    @Column()
    invitedByUserId: number;

    @Column()
    canRead: boolean;

    @Column()
    canWrite: boolean;

    @Column()
    inviteLink: string;

    @Column({ type: 'bigint' })
    invitedAt: number;

    @Column({ type: 'bigint' })
    expiredAt: number;

    @ManyToOne((type) => User, (user) => user.sharedTripsByMe, { eager: false, nullable: true })
    user: User;

    @Column({ nullable: true })
    userId: number;

    @Column({ type: 'bigint', nullable: true })
    acceptedAt: number;

    @Column({ default: false })
    isDeleted: boolean;

    @Column({ type: 'bigint', nullable: true })
    deletedAt: number;
}
