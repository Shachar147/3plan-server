import { Injectable } from "@nestjs/common";
import { User } from "../user/user.entity";
import { CalcDistanceDto } from "./dto/calc-distance.dto";
import { getTimestampInSeconds } from "../shared/utils";
import { InjectRepository } from "@nestjs/typeorm";
import { DistanceRepository, DistanceResult } from "./distance.repository";
import { toArray } from "rxjs/operators";
import { Coordinate } from "./common";

const DB_DATA_EXPIRY_IN_DAYS = 30;
const SECONDS_IN_DAY = 86400;

@Injectable()
export class DistanceService {
  constructor(
    @InjectRepository(DistanceRepository)
    private distanceRepository: DistanceRepository
  ) {}

  async getDistanceBetweenTwoDestinations(
    params: CalcDistanceDto,
    user: User
  ): Promise<any> {
    const origin: Coordinate = params.origin;

    const destinations = [];
    const exist = [];

    const origins = [`${origin.lat},${origin.lng}`];

    params.destinations.forEach(async (destination: Coordinate) => {
      // todo move to bulk
      for (let i = 0; i < to.length; i++) {
        const distanceFromDB = await this.distanceRepository.findDistance(
            from,
            to[i]
        );
    });

    for (let i = 0; i < to.length; i++) {
      const distanceFromDB = await this.distanceRepository.findDistance(
        from,
        to[i]
      );
      if (distanceFromDB) {
        const diffInDays =
          (getTimestampInSeconds() -
            Math.floor(distanceFromDB.addedAt.getTime() / 1000)) /
          SECONDS_IN_DAY;
        if (diffInDays <= DB_DATA_EXPIRY_IN_DAYS) {
          exist.push(
            this.distanceRepository.distanceToDistanceResult(distanceFromDB)
          );
        } else {
        }
      } else {
        destinations.push([[to[i].lat, to[i].lng].join(",")]);
      }
    }
    const distance = require("google-distance-matrix");
    const result = await this.distanceRepository.calculateDistanceChunks(
      origins,
      destinations,
      distance
    );

    for (var i = 0; i < result.results.length; i++) {
      await this.distanceRepository.upsertDistance(
        params,
        user,
        result.results[i],
        distance
      );
    }

    // @ts-ignore
    return {
      ...result,
      exist,
      travelMode: distance.options.mode.toUpperCase(),
      from,
      to,
    };
  }

  // async getDistanceBetweenTwoDestination(
  //   DistanceDto: CreateDistanceDto,
  //   user: User
  // ): Promise<DistanceResult> {
  //   const { from, to } = DistanceDto;
  //
  //   const origins = [[from.lat, from.lng].join(",")];
  //   const destinations = [[to.lat, to.lng].join(",")];
  //
  //   // return from db if already exist
  //   const distanceFromDB = await this.distanceRepository.findDistance(from, to);
  //   if (distanceFromDB) {
  //     const diffInDays =
  //       (getTimestampInSeconds() -
  //         Math.floor(distanceFromDB.addedAt.getTime() / 1000)) /
  //       SECONDS_IN_DAY;
  //     if (diffInDays <= DB_DATA_EXPIRY_IN_DAYS) {
  //       return this.distanceRepository.distanceToDistanceResult(distanceFromDB);
  //     }
  //   }
  //
  //   // else calculate from google
  //   const distance = require("google-distance-matrix");
  //   const result = await this.distanceRepository.calculateDistance(
  //     origins,
  //     destinations,
  //     distance
  //   );
  //
  //   await this.distanceRepository.upsertDistance(
  //     DistanceDto,
  //     user,
  //     result,
  //     distance,
  //     !!distanceFromDB
  //   );
  //
  //   // @ts-ignore
  //   return {
  //     ...result,
  //     travelMode: distance.options.mode.toUpperCase(),
  //     from,
  //     to,
  //   };
  // }
}
