import {Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "../user/user.entity";
import {SharedTripsRepository} from "./shared-trips.repository";
import {addMinutes} from "../shared/utils";
import {inviteLinkExpiredTimeMinutes} from "./shared-trips.entity";

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
            // todo complete: this logic of checking if link is expired and if not extend it's expiry not working well.
            // const currentTime = new Date(dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset())).toISOString()
            // const dt = addMinutes(new Date(), inviteLinkExpiredTimeMinutes);
            // existingLink.expiredAt = new Date(dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset()));
            // existingLink.expiredAt = new Date(new Date().getTime()/1000 + inviteLinkExpiredTimeMinutes * 1000 * 60 * 60);
            // return await existingLink.save();
            return existingLink;
        }

        return await this.sharedTripsRepository.createInviteLink(tripId, canRead, canWrite, user);
    }
}
