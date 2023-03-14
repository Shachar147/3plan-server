import { Injectable } from "@nestjs/common";
import { User } from "../user/user.entity";
import { CalcDistanceDto } from "./dto/calc-distance.dto";
import { getTimestampInSeconds } from "../shared/utils";
import { InjectRepository } from "@nestjs/typeorm";
import { DistanceRepository, DistanceResult } from "./distance.repository";
import { toArray } from "rxjs/operators";
import { Coordinate } from "./common";
import { In } from "typeorm";
import {Distance} from "./distance.entity";

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
    const from: Coordinate = params.from;
    const to: Coordinate[] = params.to;

    const destinations = [];
    const exist = [];

    const origins = [`${from.lat},${from.lng}`];

    const resultsFromDb: Distance[] = await this.distanceRepository.find({
      where: {
        from: from,
        to: In(to),
      },
    });

    for (const destination of to) {
      // todo move to bulk
      // const distanceFromDB = await this.distanceRepository.findDistance(
      //     from,
      //     destination
      // );

      const distanceFromDB = resultsFromDb.find(
        (row) =>
          row.to.lat === destination.lat && row.to.lng === destination.lng
      );

      const diffInDays = distanceFromDB
        ? (getTimestampInSeconds() -
            Math.floor(distanceFromDB.addedAt.getTime() / 1000)) /
          SECONDS_IN_DAY
        : 9999;

      // valid only if exist and not expired
      const isValid = !!distanceFromDB && diffInDays <= DB_DATA_EXPIRY_IN_DAYS;

      if (isValid) {
        exist.push(
          this.distanceRepository.distanceToDistanceResult(distanceFromDB)
        );
      } else {
        destinations.push(`${destination.lat},${destination.lng}`);
      }
    }

    // todo fix require
    const distance = require("google-distance-matrix");

    // todo add type
    const result = await this.distanceRepository.calculateDistanceChunks(
      origins,
      destinations,
      distance
    );

    const results: Distance[] = [...result.results, ...exist];

    for (const result of results) {
      await this.distanceRepository.createDistance({
        from: result.from,
        to: result.to
      }, user, result, distance);
    }

    // @ts-ignore
    return {
      results,
      from,
      to,
    };
  }
}
