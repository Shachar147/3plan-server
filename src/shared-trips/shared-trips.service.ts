import {BadRequestException, Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "../user/user.entity";
import {SharedTripsRepository} from "./shared-trips.repository";

@Injectable()
export class SharedTripsService {

    private logger = new Logger("SharedTripsService");
    constructor(
        @InjectRepository(SharedTripsRepository)
        private sharedTripsRepository: SharedTripsRepository,
    ) {

    }

    async createInviteLink(tripId: number, canRead: boolean, canWrite: boolean, user: User) {
        const existingLink = await this.sharedTripsRepository.getExistingUnacceptedInvitelink(tripId, canRead, canWrite, user);
        if (existingLink) {
            existingLink.expiredAt = parseInt((new Date().getTime()/1000).toString());
            return await existingLink.save();
        }

        return await this.sharedTripsRepository.createInviteLink(tripId, canRead, canWrite, user);
    }

    async useInviteLink(token: string, user: User) {
        const inviteLinkData = await this.sharedTripsRepository.isTokenValid(token);
        if (!inviteLinkData){
            throw new BadRequestException(
                "invalidInviteLink",
                `invite link is invalid. probably expired.`
            );
        } else {

            const currentTime = parseInt((new Date().getTime()/1000).toString());

            // remove previous share links of this user for this trip
            const prevPermissions =
                await this.sharedTripsRepository.createQueryBuilder("shared-trips")
                    .where("shared-trips.tripId = :id", { id: inviteLinkData.tripId })
                    .andWhere('shared-trips.userId = :userId', { userId: user.id })
                    .andWhere('shared-trips.isDeleted = :isDeleted', { isDeleted: false })
                    .getMany();
            for (let i=0; i< prevPermissions.length; i++){
                const prev = prevPermissions[i];
                prev.isDeleted = true;
                prev.deletedAt = currentTime;
                await prev.save();
            }

            if (inviteLinkData.invitedByUserId == user.id) {
                return inviteLinkData;
            }
            inviteLinkData.user = user;
            inviteLinkData.acceptedAt = currentTime;
            return await inviteLinkData.save();
        }
    }
}
