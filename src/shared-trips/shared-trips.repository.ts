import {ConflictException, Injectable, InternalServerErrorException, Logger} from "@nestjs/common";
import {EntityRepository, Raw, Repository} from "typeorm";
import {inviteLinkExpiredTimeMinutes, SharedTrips} from "./shared-trips.entity";
import {User} from "../user/user.entity";
import {v4 as uuidv4} from 'uuid';
import {addMinutes} from "../shared/utils";


@Injectable()
@EntityRepository(SharedTrips)
export class SharedTripsRepository extends Repository<SharedTrips> {
    private logger = new Logger("SharedTripsRepository");

    async getExistingUnacceptedInvitelink(tripId: number, canRead: boolean, canWrite: boolean, invitedByUser: User) {
        const findOne = async (tripId: number, canRead: boolean, canWrite: boolean, invitedByUser: User) => {

            const currentTime = parseInt((new Date().getTime()/1000).toString());

            const query = this.createQueryBuilder("shared-trips")
                .where("shared-trips.tripId = :id", { id: tripId })
                .andWhere("shared-trips.canRead = :canRead", {
                    canRead
                })
                .andWhere("shared-trips.canWrite = :canWrite", {
                    canWrite
                })
                .andWhere("shared-trips.invitedByUserId = :invitedByUserId", {
                    invitedByUserId: invitedByUser.id
                })
                .andWhere('shared-trips.expiredAt > :currentTime', { currentTime })
                .andWhere('shared-trips.isDeleted = :isDeleted', { isDeleted: false })
                .andWhere("shared-trips.user is NULL");

            console.log(query.getSql())

            return await query.getOne();
        }

        return await findOne(tripId, canRead, canWrite, invitedByUser);
    }

    async isTokenValid(token: string, userId: number) {
        const currentTime = parseInt((new Date().getTime()/1000).toString());

        const queryBuilder = this.createQueryBuilder("shared-trips");

        const query = queryBuilder
            .where("shared-trips.inviteLink = :token", { token })
            .andWhere('shared-trips.expiredAt > :currentTime', { currentTime })
            .andWhere('shared-trips.isDeleted = :isDeleted', { isDeleted: false })
            .andWhere("shared-trips.userId is NULL");
        let found = await query.getOne();

        if (!found) {
            const query2 = queryBuilder
                .where("shared-trips.inviteLink = :token", {token})
                .andWhere('shared-trips.isDeleted = :isDeleted', {isDeleted: false})
                .andWhere("shared-trips.userId = :userId", {userId: userId});
            found = await query2.getOne();

            return found
        }

        return found;
    }

    async createInviteLink(tripId: number, canRead: boolean, canWrite: boolean, invitedByUserId: User): Promise<SharedTrips> {
        const sharedTrip = new SharedTrips();
        sharedTrip.tripId = tripId;
        sharedTrip.canRead = canRead;
        sharedTrip.canWrite = canWrite;
        sharedTrip.invitedByUser = invitedByUserId;
        sharedTrip.inviteLink = uuidv4();
        sharedTrip.expiredAt = parseInt((addMinutes(new Date(), inviteLinkExpiredTimeMinutes).getTime()/1000).toString());
        sharedTrip.invitedAt = parseInt((new Date().getTime()/1000).toString());

        try {
            await sharedTrip.save();
        } catch (error) {
            console.error(error);
            if (Number(error.code) === 23505) {
                // duplicate trip name
                throw new ConflictException("Invite Link already exists");
            } else {
                throw new InternalServerErrorException();
            }
        }

        return sharedTrip;
    }

    async getSharedWithMeTripIds(user: User): Promise<number[]> {
        const result = await this.createQueryBuilder("shared-trips")
            .select("shared-trips.tripId")
            .where("shared-trips.userId = :userId", { userId: user.id })
            .andWhere('shared-trips.isDeleted = :isDeleted', { isDeleted: false })
            .getMany();

        return result.map((x) => x.tripId);
    }
}
