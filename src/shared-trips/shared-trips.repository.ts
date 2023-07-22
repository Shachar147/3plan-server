import {ConflictException, Injectable, InternalServerErrorException, Logger} from "@nestjs/common";
import {EntityRepository, Raw, Repository} from "typeorm";
import {SharedTrips} from "./shared-trips.entity";
import {User} from "../user/user.entity";
import {v4 as uuidv4} from 'uuid';


@Injectable()
@EntityRepository(SharedTrips)
export class SharedTripsRepository extends Repository<SharedTrips> {
    private logger = new Logger("SharedTripsRepository");

    async getExistingUnacceptedInvitelink(tripId: number, canRead: boolean, canWrite: boolean, invitedByUser: User) {
        const findOne = async (tripId: number, canRead: boolean, canWrite: boolean, invitedByUser: User) => {

            const dt = new Date();
            const currentTime = new Date(dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset())).toISOString()

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
                // .andWhere('shared-trips.expiredAt > :currentTime', { currentTime })
                .andWhere("shared-trips.userId is NULL");

            console.log(query.getSql())

            return await query.getOne();
        }

        return await findOne(tripId, canRead, canWrite, invitedByUser);
    }

    async createInviteLink(tripId: number, canRead: boolean, canWrite: boolean, invitedByUserId: User): Promise<SharedTrips> {
        const sharedTrip = new SharedTrips();
        sharedTrip.tripId = tripId;
        sharedTrip.canRead = canRead;
        sharedTrip.canWrite = canWrite;
        sharedTrip.invitedByUser = invitedByUserId;
        sharedTrip.inviteLink = uuidv4();

        try {
            await sharedTrip.save();
        } catch (error) {
            if (Number(error.code) === 23505) {
                // duplicate trip name
                throw new ConflictException("Invite Link already exists");
            } else {
                throw new InternalServerErrorException();
            }
        }

        return sharedTrip;
    }
}
