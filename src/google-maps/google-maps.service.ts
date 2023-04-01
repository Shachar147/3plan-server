import { Injectable } from '@nestjs/common';
import { Client, LatLngLiteral, TravelMode } from '@googlemaps/google-maps-services-js';
import { chunk } from 'lodash';
import {coordinateToString} from "../shared/utils";

@Injectable()
export class GoogleMapsService {
    private readonly client: Client;
    private requestCount: number = 0;

    constructor() {
        this.client = new Client({});
    }

    async getRoutes(
        origins: LatLngLiteral[],
        destinations: LatLngLiteral[],
        mode: TravelMode,
        apiKey: string,
    ): Promise<any> {
        const MAX_ELEMENTS = 10;
        let results: any[] = [];

        const originChunks = chunk(origins, MAX_ELEMENTS);
        const destinationChunks = chunk(destinations, MAX_ELEMENTS);

        for (const originsChunk of originChunks) {
            for (const destinationsChunk of destinationChunks) {
                console.log({ originsChunk, destinationsChunk });
                const response = await this.client.distancematrix({
                    params: {
                        origins: originsChunk.map((origin) => `${origin.lat},${origin.lng}`).join('|'),
                        destinations: destinationsChunk.map((destination) => `${destination.lat},${destination.lng}`).join('|'),
                        mode: mode,
                        key: apiKey,
                    },
                });

                // const response = {
                //     status: 200,
                //     data: {
                //         rows: [],
                //         origin_addresses: [],
                //         destination_addresses: [],
                //         error_message: "",
                //     }
                // }

                this.requestCount++;

                if (response.status !== 200) {
                    throw new Error(`Failed to get routes: ${response.data.error_message}`);
                }

                console.log('Response:', response.status, response.data);
                // console.log('Response data:', response.data);


                for (let i = 0; i < response.data.rows.length; i++) {
                    const originAddress = response.data.origin_addresses[i];
                    const destinationAddress = response.data.destination_addresses[i];
                    const originLatLng = originsChunk[i];
                    const elements = response.data.rows[i].elements;
                    for (let j = 0; j < elements.length; j++) {
                        const destinationLatLng = destinationsChunk[j];
                        const element = elements[j];
                        results.push({
                            origin: originAddress,
                            destination: destinationAddress,
                            distance: element.distance,
                            duration: element.duration,
                            from: coordinateToString(originLatLng),
                            to: coordinateToString(destinationLatLng),
                            travelMode: mode
                        });
                    }
                }
            }
        }

        return results;
    }

    getRequestCount(): number {
        return this.requestCount;
    }
}
