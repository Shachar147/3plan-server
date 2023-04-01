import { Distance } from "./distance.entity";
import { EntityRepository, Repository } from "typeorm";
import { User } from "../user/user.entity";
import { BadRequestException } from "@nestjs/common";
import { UpsertDistanceDto } from "./dto/upsert-distance.dto";
import { CalculateDistancesResult, DistanceDiff, TravelMode } from "./common";
import { Coordinate } from "../shared/interfaces";
import { coordinateToString } from "../shared/utils";

@EntityRepository(Distance)
export class DistanceRepository extends Repository<Distance> {
  async createDistance(dto: UpsertDistanceDto, user: User) {
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

    return {
      ...dis,
      addedBy: {
        id: user.id,
        username: user.username,
      },
    };
  }

  async updateDistance(
    distance: Distance,
    dto: UpsertDistanceDto
  ): Promise<any> {
    const updates = this.updateAndGetDiff(distance, dto);
    const isChanged = updates.length > 0;
    distance.addedAt = new Date();
    await distance.save();
    return { isChanged, updates, distance };
  }

  async upsertDistance(distanceDto: UpsertDistanceDto, user: User) {
    const { from, to, travelMode } = distanceDto;
    const queryBuilder = this.createQueryBuilder("distance");
    const distanceFromDB = await queryBuilder
      .where("distance.from = :from", { from })
      .andWhere("distance.to = :to", { to })
      .andWhere("distance.travelMode = :travelMode", { travelMode })
      .getOne();

    if (distanceFromDB) {
      await this.updateDistance(distanceFromDB, distanceDto);
    } else {
      await this.createDistance(distanceDto, user);
    }
  }

  updateAndGetDiff(distance: Distance, dto: UpsertDistanceDto): DistanceDiff[] {
    const updates = [];
    const complexFields = ["travelMode", "distance", "duration"];

    Object.keys(dto).forEach((key) => {
      const shouldUpdate =
        (complexFields.includes(key) &&
          JSON.stringify(dto[key]) !== JSON.stringify(distance[key])) ||
        (!complexFields.includes(key) && dto[key] !== distance[key]);

      if (shouldUpdate) {
        updates.push({
          what: key,
          was: distance[key],
          now: dto[key],
        });
        distance[key] = dto[key];
      }
    });

    return updates;
  }

  async calculateDistances(
    origins: string[],
    destinations: string[],
    distance,
    numOfGoogleCalls: number
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

        distance.matrix(origins, destinations, function (err, distances) {
          numOfGoogleCalls++;

          if (err) {
            reject(err);
          }
          if (!distances) {
            reject("no distances");
          }

          if (distances.status == "OK") {
            for (let i = 0; i < origins.length; i++) {
              for (let j = 0; j < destinations.length; j++) {
                const origin = distances.origin_addresses[i];
                const destination = distances.destination_addresses[j];
                if (distances.rows[0].elements[j].status == "OK") {
                  results.push({
                    origin,
                    distance: distances.rows[i].elements[j].distance,
                    destination,
                    duration: distances.rows[i].elements[j].duration,
                    travelMode,
                    from: origins[i],
                    to: destinations[j],
                  });
                } else {
                  errors.push({
                    errorText:
                      destination + " is not reachable by land from " + origin,
                    errorData: distances.rows[0].elements[j],
                    origin,
                    distance: undefined,
                    destination,
                    duration: undefined,
                    travelMode,
                    from: origins[i],
                    to: destinations[j],
                  });
                }
              }
            }
            resolve({ errors, results, numOfGoogleCalls });
          }
        });
      });
    } catch (e) {
      throw new BadRequestException(
        "distanceCalcError",
        `oops something wen't wrong: ${JSON.stringify(e)}`
      );
    }
  }

  async findDistancesByFromAndTo(
    from: Coordinate[],
    to: Coordinate[],
    travelMode?: TravelMode
  ): Promise<Distance[]> {
    const queryBuilder = this.createQueryBuilder("distance");
    let query = queryBuilder
      .where("distance.from = ANY(:from)", {
        from: from.map((c) => coordinateToString(c)),
      })
      .andWhere("distance.to = ANY(:to)", {
        to: to.map((c) => coordinateToString(c)),
      });
    if (travelMode) {
      query = query.andWhere("distance.travelMode = :travelMode", {
        travelMode: travelMode,
      });
    }
    return query.getMany();
  }

  async getNearbyPlacesByCoordinate(coordinate: Coordinate, user: User) {
    const queryBuilder = this.createQueryBuilder("distance");
    return await queryBuilder
      .where("distance.from = :from", { from: coordinateToString(coordinate) })
      .getMany();
  }
}
