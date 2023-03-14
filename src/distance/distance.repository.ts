import { Distance } from "./distance.entity";
import { EntityRepository, Repository } from "typeorm";
import { User } from "../user/user.entity";
import { BadRequestException } from "@nestjs/common";
import { Coordinate, CalcDistanceDto } from "./dto/calc-distance.dto";
import { updateDistanceDto } from "./dto/update.distance.dto";
import { TextValueObject, TravelMode } from "./common";
import { getTimestampInSeconds } from "../shared/utils";

export interface DistanceResult {
  origin: string;
  destination: string;
  duration: TextValueObject;
  distance: TextValueObject;
  travelMode: TravelMode;
  from: Coordinate;
  to: Coordinate;
}

const DB_DATA_EXPIRY_IN_DAYS = 30;
const SECONDS_IN_DAY = 86400;

@EntityRepository(Distance)
export class DistanceRepository extends Repository<Distance> {
  // async createDistance(
  //   createDistanceDto: CreateDistanceDto,
  //   user: User,
  //   result,
  //   distance
  // ) {
  //   const { from, to } = createDistanceDto;
  //   const dis = new Distance();
  //   dis.destination = result.destination;
  //   dis.distance = result.distance;
  //   dis.origin = result.origin;
  //   dis.travel_mode = distance.options.mode.toUpperCase();
  //   dis.duration = result.duration;
  //   dis.from = from;
  //   dis.to = to;
  //   dis.addedBy = user;
  //
  //   try {
  //     await dis.save();
  //   } catch (e) {
  //     if (e.code === "23505") {
  //       throw new BadRequestException(
  //         "DistanceAlreadyExist",
  //         `the distance between ${from} and ${to} (in ${dis.travel_mode}) is already exist`
  //       );
  //     }
  //     throw e;
  //   }
  //
  //   // @ts-ignore
  //   dis.addedBy = {
  //     id: user.id,
  //     username: user.username,
  //   };
  // }

  async updateDistance(
    distance: Distance,
    DistanceDto: updateDistanceDto
  ): Promise<any> {
    const updates = this.updateAndGetDiff(distance, DistanceDto);
    const isUpdated = updates.length > 0;
    if (isUpdated) {
      await distance.save();
    }
    return { isUpdated, updates, distance };
  }

  async upsertDistance(
    DistanceDto: CalcDistanceDto,
    user: User,
    result: object,
    distance
  ) {
    //if (isExist) {
    //await this.updateDistance(distance, DistanceDto);
    //} else {
    //await this.createDistance(DistanceDto, user, result, distance);
    //}
  }

  updateAndGetDiff(
    distance: Distance,
    updateDistanceDto: updateDistanceDto
  ): any {
    const updates = [];
    const complexFields = ["from", "to", "travel_mode", "distance", "duration"];

    Object.keys(updateDistanceDto).forEach((key) => {
      const shouldUpdate =
        (complexFields.includes(key) &&
          JSON.stringify(updateDistanceDto[key]) !==
            JSON.stringify(distance[key])) ||
        (!complexFields.includes(key) &&
          updateDistanceDto[key] !== distance[key]);

      if (shouldUpdate) {
        updates.push({
          what: key,
          was: distance[key],
          now: updateDistanceDto[key],
        });
        distance[key] = updateDistanceDto[key];
      }
    });

    return updates;
  }

  async calculateDistance(origins, destinations, distance): Promise<any> {
    const googleKey = "AIzaSyA7I3QU1khdOUoOwQm4xPhv2_jt_cwFSNU";
    distance.key(googleKey);
    try {
      return new Promise((resolve, reject) => {
        const errors = [];
        const results = [];
        distance.matrix(origins, destinations, function (err, distances) {
          if (err) {
            reject(err);
          }
          if (!distances) {
            reject("no distances");
          }
          if (distances.status == "OK") {
            for (var i = 0; i < origins.length; i++) {
              for (var j = 0; j < destinations.length; j++) {
                var origin = distances.origin_addresses[i];
                var destination = distances.destination_addresses[j];
                var to = distances.destination_addresses[j];
                var from = origins[i];
                if (distances.rows[0].elements[j].status == "OK") {
                  var distance = distances.rows[i].elements[j].distance;
                  console.log("distances", distances);
                  var duration = distances.rows[i].elements[j].duration;
                  results.push({
                    from,
                    to,
                    origin,
                    distance,
                    destination,
                    duration,
                  });
                } else {
                  errors.push(
                    destination + " is not reachable by land from " + origin
                  );
                }
              }
            }
            resolve({
              errors,
              results,
            });
          } else {
            reject("couldn't find distance");
          }
        });
      });
    } catch (e) {
      throw new BadRequestException(
        "DistanceNotExist",
        `the distance is not exist`
      );
    }
  }

  async findDistance(from: Coordinate, to: Coordinate): Promise<Distance> {
    const distanceDB = await this.findOne({ from, to });
    return distanceDB;
  }

  distanceToDistanceResult(distance: Distance): DistanceResult {
    return {
      origin: distance.origin,
      destination: distance.destination,
      duration: distance.duration,
      distance: distance.distance,
      travelMode: distance.travel_mode,
      from: distance.from,
      to: distance.to,
    };
  }

  private readonly MAX_CHUNK_SIZE = 25;

  async calculateDistanceChunks(
    origin: string[],
    destinations: string[],
    distance
  ): Promise<{
    errors: any[];
    results: any[];
  }> {
    const chunks = this.splitIntoChunks(destinations, this.MAX_CHUNK_SIZE);
    const response = {
      errors: [],
      results: [],
    };

    for (const chunkDestinations of chunks) {
      const chunkResults = await this.calculateDistance(
        origin,
        chunkDestinations,
        distance
      );

      response.errors.push(...chunkResults.errors);
      response.results.push(...chunkResults.results);
    }
    return response;
  }

  private splitIntoChunks<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    const numChunks = Math.ceil(array.length / chunkSize);

    for (let i = 0; i < numChunks; i++) {
      const chunkStart = i * chunkSize;
      const chunkEnd = chunkStart + chunkSize;
      const chunkArray = array.slice(chunkStart, chunkEnd);
      chunks.push(chunkArray);
    }
    return chunks;
  }
}
