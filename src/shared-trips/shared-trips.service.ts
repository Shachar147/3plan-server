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
            if (inviteLinkData.invitedByUserId == user.id) {
                return inviteLinkData;
            }
            inviteLinkData.user = user;
            inviteLinkData.acceptedAt = parseInt((new Date().getTime()/1000).toString());
            return await inviteLinkData.save();
        }
    }
}
