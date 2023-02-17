import { Injectable } from '@nestjs/common';
import {User} from "../user/user.entity";
import {createDistanceDto} from "./dto/create-distance.dto";

@Injectable()
export class DistanceService {

    // @InjectRepository(ItemRepository)
    // private itemRepository: ItemRepository) {}

    async getDistanceBetweenTwoDestination(createDistanceDto: createDistanceDto[] , user: User): Promise<any> {
        const distance = require('google-distance-matrix');
        distance.key('AIzaSyA7I3QU1khdOUoOwQm4xPhv2_jt_cwFSNU');

        let item = "";
        const origins = ['47.4989928,19.0436994'];
        const destinations = ['47.4912977,19.0544491'];

        distance.matrix(origins, destinations, function (err, distances ,item) {
            if (err) {
                return console.log(err);
            }
            if(!distances) {
                return console.log('no distances');
            }
            if (distances.status == 'OK') {
                for (var i=0; i < origins.length; i++) {
                    for (var j = 0; j < destinations.length; j++) {
                        var origin = distances.origin_addresses[i];
                        var destination = distances.destination_addresses[j];
                        if (distances.rows[0].elements[j].status == 'OK') {
                            var distance = distances.rows[i].elements[j].distance.text;
                            item = { origin, distance, destination}
                        } else {
                            console.log(destination + ' is not reachable by land from ' + origin);
                        }
                    }
                }
            }
        });
    return item;
    }



}
