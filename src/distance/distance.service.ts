import { BadRequestException, Injectable } from "@nestjs/common";
import { User } from "../user/user.entity";
import { Coordinate } from "./dto/get-distance-result.dto";
import { Distance, TextValueObject, TravelMode } from "./distance.entity";
import { DistanceDto } from "./dto/create-distance.dto";
import { getTimestampInSeconds } from "../shared/utils";
import { InjectRepository } from "@nestjs/typeorm";
import { DistanceRepository, DistanceResult } from "./distance.repository";

const DB_DATA_EXPIRY_IN_DAYS = 30;
const SECONDS_IN_DAY = 86400;

@Injectable()
export class DistanceService {
  constructor(
    @InjectRepository(DistanceRepository)
    private distanceRepository: DistanceRepository
  ) {}

  async getDistanceBetweenTwoDestination(
    //distanceEntity: Distance,
    DistanceDto: DistanceDto,
    user: User
  ): Promise<DistanceResult> {
    const { from, to } = DistanceDto;

    const origins = [[from.lat, from.lng].join(",")];
    const destinations = [[to.lat, to.lng].join(",")];

    // return from db if already exist
    const distanceFromDB = await this.distanceRepository.findDistance(from, to);
    const diffInDays =
      (getTimestampInSeconds() - distanceFromDB.addedAt) / SECONDS_IN_DAY; // 86400;
    if (distanceFromDB) {
      if (diffInDays <= DB_DATA_EXPIRY_IN_DAYS) {
        return this.distanceRepository.distanceToDistanceResult(distanceFromDB);
      }

      // else calculate from google
      const distance = require("google-distance-matrix");
      const result = await this.distanceRepository.calculateDistance(
        origins,
        destinations,
        distance
      );

      await this.distanceRepository.upsertDistance(
        DistanceDto,
        user,
        result,
        distance,
        distanceFromDB
      );

      // @ts-ignore
      return {
        ...result,
        travelMode: distance.options.mode.toUpperCase(),
        from,
        to,
      };
    }
  }
}
