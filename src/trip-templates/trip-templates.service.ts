import {Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {TripRepository} from "../trip/trip.repository";
import {ListTripsDto} from "../trip/dto/list-trips-dto";
import {User} from "../user/user.entity";
import {TEMPLATES_USER_NAME} from "../shared/const";
import {UserService} from "../user/user.service";
import {shuffle} from "../shared/utils";

@Injectable()
export class TripTemplatesService {
    private readonly logger = new Logger(TripTemplatesService.name);

    constructor(
        @InjectRepository(TripRepository)
        public tripRepository: TripRepository,
        private userService: UserService,
    ) {}

    async getFeedTemplates(filterDto: ListTripsDto, user: User) {
        const templatesUser = await this.userService.getUserByName(TEMPLATES_USER_NAME);
        const trips = await this.tripRepository.getTrips(filterDto, templatesUser);

        let approvedTrips = trips.filter((t) => !t.isHidden);
        approvedTrips = shuffle(approvedTrips);

        // temporary - return all templates, but prefer approved.
        // let approvedTrips = trips.sort((a, b) => {
        //     if (a.isHidden && !b.isHidden) {
        //         return 1;
        //     } else if (!a.isHidden && b.isHidden) {
        //         return -1;
        //     }
        //     return 0;
        // });

        // todo complete: add some logic of how to choose which templates to show? (prefer templates created by us? do some kind of rating mechanism for templates as well?)

        return approvedTrips.slice(0, Math.min(approvedTrips.length, 5));
    }
}
