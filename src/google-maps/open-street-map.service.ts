import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GraphHopperService {
    private readonly apiKey: string = 'AifA44deL3U62Y7QHd0rpTLO8oUgT0Sb6KnQl7N84v-4Hn8DG2EyC8eb86HlUZPx';
    private readonly baseURL: string = 'http://dev.virtualearth.net/REST/v1';

    async getRoutes(
        origins: [number, number][],
        destinations: [number, number][],
        mode: string,
    ) {
        const params = {
            key: this.apiKey,
            routeAttributes: 'routePath,routeSummariesOnly',
            distanceUnit: 'km',
            travelMode: mode === 'WALKING' ? 'Walking' : 'Driving',
            optimize: 'distance',
            waypoints: `${origins
                .map((coord) => `${coord[0]},${coord[1]}`)
                .join(';')};${destinations
                .map((coord) => `${coord[0]},${coord[1]}`)
                .join(';')}`,
        };

        const response = await axios.get(`${this.baseURL}/Routes`, { params });
        if (response.status !== 200) {
            throw new Error(`Failed to get routes: ${response.statusText}`);
        }

        const { resourceSets } = response.data;
        const results = [];

        for (let i = 0; i < resourceSets.length; i++) {
            const { resources } = resourceSets[i];
            for (let j = 0; j < resources.length; j++) {
                const { travelDistance, travelDuration, routePath, routeLegs } =
                    resources[j];
                const origin = [routePath.line.coordinates[0][0], routePath.line.coordinates[0][1]];
                const destination = [
                    routePath.line.coordinates[routePath.line.coordinates.length - 1][0],
                    routePath.line.coordinates[routePath.line.coordinates.length - 1][1],
                ];
                const instructions = [];
                for (let k = 0; k < routeLegs.length; k++) {
                    const { itineraryItems } = routeLegs[k];
                    for (let l = 0; l < itineraryItems.length; l++) {
                        const { instruction } = itineraryItems[l];
                        instructions.push(instruction.text);
                    }
                }
                results.push({
                    origin,
                    destination,
                    distance: travelDistance,
                    duration: travelDuration / 60,
                    instructions,
                    travelMode: mode,
                });
            }
        }

        return results;
    }
}
