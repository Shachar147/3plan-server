import {
    BaseEntity,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Unique, ManyToOne,
} from 'typeorm';
import {User} from "../user/user.entity";

export const inviteLinkExpiredTimeMinutes = 1;

@Unique(['tripId', 'userId', 'canRead', 'canWrite'])
@Entity()
export class SharedTrips extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tripId: number

    @ManyToOne((type) => User, (user) => user.sharedTripsByMe, { eager: false })
    invitedByUser: User;

    @Column()
    canRead: boolean;

    @Column()
    canWrite: boolean;

    @Column()
    inviteLink: string;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    invitedAt: Date;

    @Column({ type: 'timestamp', default: () => `CURRENT_TIMESTAMP + INTERVAL '${inviteLinkExpiredTimeMinutes} minutes'` })
    expiredAt: Date;

    @ManyToOne((type) => User, (user) => user.sharedTripsByMe, { eager: false, nullable: true })
    userId: User;

    @Column('timestamp', { nullable: true })
    acceptedAt: Date;
}
