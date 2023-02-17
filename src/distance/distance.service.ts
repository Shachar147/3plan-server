import { Injectable } from '@nestjs/common';
import {User} from "../user/user.entity";
import {Coordinate, GetDistanceResultDto} from "./dto/get-distance-result.dto";

type TravelMode = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";

interface DistanceResult {
    origin: string,
    destination: string,
    duration: {
        text: string,
        value: number,
    },
    distance: {
        text: string,
        value: number,
    },
    travelMode: TravelMode,
    from: Coordinate,
    to: Coordinate
}

@Injectable()
export class DistanceService {

    // @InjectRepository(ItemRepository)
    // private itemRepository: ItemRepository) {}

    async calculateDistance(origins, destinations, distance): Promise<Partial<DistanceResult>> {
        distance.key('AIzaSyA7I3QU1khdOUoOwQm4xPhv2_jt_cwFSNU');
        console.log(distance.options.mode);
        return new Promise((resolve, reject) => {
            distance.matrix(origins, destinations, function (err, distances) {
                if (err) {
                    reject(err);
                }
                if (!distances) {
                    reject('no distances');
                }
                if (distances.status == 'OK') {
                    for (var i = 0; i < origins.length; i++) {
                        for (var j = 0; j < destinations.length; j++) {
                            var origin = distances.origin_addresses[i];
                            var destination = distances.destination_addresses[j];
                            if (distances.rows[0].elements[j].status == 'OK') {
                                var distance = distances.rows[i].elements[j].distance;
                                console.log('distances', distances);
                                var duration = distances.rows[i].elements[j].duration;
                                resolve({origin, distance, destination, duration});
                            } else {
                                console.log(destination + ' is not reachable by land from ' + origin);
                            }
                        }
                    }
                }
            });
        });
    }

    async getDistanceBetweenTwoDestination(getDistanceResultDto: GetDistanceResultDto , user: User): Promise<DistanceResult> {
        const {from, to} = getDistanceResultDto;

        const origins = [[from.lat, from.lng].join(",")]; //['47.4989928,19.0436994'];
        const destinations = [[to.lat, to.lng].join(",")];//['47.4912977,19.0544491'];
        const distance = require('google-distance-matrix');
        const result = await this.calculateDistance(origins, destinations,distance);

        // @ts-ignore
        return {
            ...result,
            travelMode: distance.options.mode.toUpperCase(),
            from,
            to

            }

        }
}
