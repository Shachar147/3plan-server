import { Distance } from "./distance.entity";
import { EntityRepository, Repository } from "typeorm";
import { User } from "../user/user.entity";
import { BadRequestException } from "@nestjs/common";
import { CreateDistanceDto } from "./dto/create-distance.dto";
import { updateDistanceDto } from "./dto/update.distance.dto";
import { TextValueObject, TravelMode } from "./common";
import { Coordinate } from "../shared/interfaces";
import {stringToCoordinate} from "../shared/utils";

export interface CalculateDistancesResult {
  errors: any[];
  results: DistanceResult[];
  totals?: any;
  routesToCalculate?: string[];
}

export interface DistanceResult {
  origin: string;
  destination: string;
  duration: TextValueObject;
  distance: TextValueObject;
  travelMode: TravelMode;
  from: Coordinate;
  to: Coordinate;
}

@EntityRepository(Distance)
export class DistanceRepository extends Repository<Distance> {
  async createDistance(dto: CreateDistanceDto, user: User) {
    const dis = new Distance();
    dis.destination = dto.destination;
    dis.distance = dto.distance;
    dis.origin = dto.origin;
    dis.travelMode = dto.travelMode;
    dis.duration = dto.duration;
    dis.from = dto.from;
    dis.to = dto.to;
    dis.addedBy = user;

    try {
      await dis.save();
    } catch (e) {
      if (e.code === "23505") {
        throw new BadRequestException(
          "DistanceAlreadyExist",
          `the distance between ${dis.from} and ${dis.to} (in ${dis.travelMode}) is already exist`
        );
      }
      throw e;
    }

    // @ts-ignore
    dis.addedBy = {
      id: user.id,
      username: user.username,
    };
  }

  async updateDistance(
    distance: Distance,
    DistanceDto: updateDistanceDto
  ): Promise<any> {
    const updates = this.updateAndGetDiff(distance, DistanceDto);
    const isChanged = updates.length > 0;
    distance.addedAt = new Date();
    await distance.save();
    return { isChanged, updates, distance };
  }

  // todo complete
  async upsertDistance(distanceDto: CreateDistanceDto, user: User) {
    const queryBuilder = this.createQueryBuilder("distance");
    const distanceFromDB = await queryBuilder
      .where("distance.from = :from", {
        from: JSON.stringify(distanceDto.from),
      })
      .andWhere("distance.to = :to", { to: JSON.stringify(distanceDto.to) })
      .getOne();

    if (distanceFromDB) {
      await this.updateDistance(distanceFromDB, distanceDto);
    } else {
      await this.createDistance(distanceDto, user);
    }

    // if (distanceFromDb) {
    //   await this.updateDistance(distanceFromDb, distanceDto);
    // } else {
    //   await this.createDistance(distanceDto, user, result, distance);
    // }
  }

  updateAndGetDiff(
    distance: Distance,
    updateDistanceDto: updateDistanceDto
  ): any {
    const updates = [];
    const complexFields = ["from", "to", "travelMode", "distance", "duration"];

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

  async calculateDistances(
    origins: string[],
    destinations: string[],
    distance
  ): Promise<CalculateDistancesResult> {
    const errors = [];
    const results = [];
    try {
      return new Promise((resolve, reject) => {
        const travelMode = distance.options.mode.toUpperCase();

        // temp - fake
        // for (let i = 0; i < origins.length && i <= 25; i++) {
        //   for (let j = 0; j < destinations.length && j <= 25; j++) {
        //     results.push({
        //       origin: 'N/A',
        //       distance: 'N/A',
        //       destination: 'N/A',
        //       duration: 'N/A',
        //       travelMode,
        //       from: stringToCoordinate(origins[i]),
        //       to: stringToCoordinate(destinations[j]),
        //     });
        //   }
        // }
        //
        // resolve({
        //   errors,
        //   results
        // })

        // todo complete - add chunks
        distance.matrix(origins, destinations, function (err, distances) {
          if (err) {
            reject(err);
          }
          if (!distances) {
            reject("no distances");
          }

          console.log({
            origins: origins.length,
            destinations: destinations.length,
            status: distances.status,
          })

          if (distances.status == "OK") {
            for (let i = 0; i < origins.length; i++) {
              for (let j = 0; j < destinations.length; j++) {
                const origin = distances.origin_addresses[i];
                const destination = distances.destination_addresses[j];
                if (distances.rows[0].elements[j].status == "OK") {
                  const distance = distances.rows[i].elements[j].distance;
                  const duration = distances.rows[i].elements[j].duration;
                  results.push({
                    origin,
                    distance,
                    destination,
                    duration,
                    travelMode,
                    from: stringToCoordinate(origins[i]),
                    to: stringToCoordinate(destinations[j]),
                  });
                } else {
                  errors.push({
                    errorText: destination + " is not reachable by land from " + origin,
                    errorData: distances.rows[0].elements[j],
                    origin,
                    distance: undefined,
                    destination,
                    duration: undefined,
                    travelMode,
                    from: stringToCoordinate(origins[i]),
                    to: stringToCoordinate(destinations[j]),
                  });
                }
              }
            }
            resolve({
              errors,
              results,
            });
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
    return await this.findOne({ from, to });
  }

  async findDistancesByFromAndTo(
    from: Coordinate[],
    to: Coordinate[],
    travelMode: TravelMode
  ): Promise<Distance[]> {
    const queryBuilder = this.createQueryBuilder("distance");
    const query = await queryBuilder
      .where("distance.from = ANY(:from)", { from: from.map((c) => JSON.stringify(c)) })
      .andWhere("distance.travelMode = :travelMode", { travelMode: travelMode })
      .andWhere("distance.to = ANY(:to)", { to: to.map((c) => JSON.stringify(c)) })
      .getMany();

    return query;
  }

  async getNearbyPlacesByCoordinate(coordinate: Coordinate, user: User) {
    const queryBuilder = this.createQueryBuilder("distance");
    const query = await queryBuilder
        .where("distance.from = :from", { from: JSON.stringify(coordinate) })
        // .andWhere("distance.travelMode = :travelMode", { travelMode: travelMode })
        // .andWhere("distance.to = ANY(:to)", { to: to.map((c) => JSON.stringify(c)) })
        .getMany();

    return query;
  }
}
