import {Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {TripRepository} from "../trip/trip.repository";
import {BackupsService} from "../backups/backups.service";
import {ListTripsDto} from "../trip/dto/list-trips-dto";
import {User} from "../user/user.entity";

@Injectable()
export class SharedTripsService {

    private logger = new Logger("TripService");
    constructor(
        @InjectRepository(TripRepository)
        private tripRepository: TripRepository,
    ) {

    }

    async getInviteLink(id: number, user: User) {
        //return await this.tripRepository.getTrips(filterDto, user);
    }
}
