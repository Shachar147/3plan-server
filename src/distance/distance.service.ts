import {Injectable} from "@nestjs/common";
import {User} from "../user/user.entity";
import {CreateDistanceDto} from "./dto/create-distance.dto";
import {coordinateToString, getTimestampInSeconds, sleep, stringToCoordinate,} from "../shared/utils";
import {InjectRepository} from "@nestjs/typeorm";
import {CalculateDistancesResult, DistanceRepository,} from "./distance.repository";
import {GetDistanceResultDto} from "./dto/get-distance-result.dto";
import {chunk} from "lodash";
import {TripService} from "../trip/trip.service";
import {TaskStatusService} from "../task-status/task-status.service";
import {TaskStatusType} from "../task-status/task-status.entity";
import {CreateTaskDto} from "../task-status/dto/create-task.dto";
import {Coordinate} from "../shared/interfaces";
import {TravelMode} from "./common";

const DB_DATA_EXPIRY_IN_DAYS = 30;
const SECONDS_IN_DAY = 86400;

@Injectable()
export class DistanceService {
  constructor(
    @InjectRepository(DistanceRepository)
    private distanceRepository: DistanceRepository,
    private tripService: TripService,
    private taskStatusService: TaskStatusService
  ) {}

  async getDistanceResultInChunks(
    params: GetDistanceResultDto,
    user: User
  ): Promise<{ taskId: number }> {

    const trip = await this.tripService.getTripByName(params.tripName, user);

    const stackTrace = ['initiating distance calculation'];
    const createTaskDto: CreateTaskDto = {
      taskInfo: {
        type: 'getDistanceResultInChunks',
        params
      },
      status: TaskStatusType.inProgress,
      detailedStatus: { stackTrace },
      progress: 0,
      relatedTrip: trip
    };
    const taskStatus = await this.taskStatusService.createTask(createTaskDto, user);
    console.log(`task #${taskStatus.id} created`);

    const runInBackground = async () => {
      let { from, to } = params;
      from = Array.from(
          new Set(from.map((x) => JSON.stringify({ lat: x.lat, lng: x.lng })))
      ).map((x) => JSON.parse(x));
      to = Array.from(
          new Set(to.map((x) => JSON.stringify({ lat: x.lat, lng: x.lng })))
      ).map((x) => JSON.parse(x));

      const MAX_IN_CHUNK = 10;

      const from_chunks = chunk(from, MAX_IN_CHUNK);
      const to_chunks = chunk(to, MAX_IN_CHUNK);

      const result = {
        errors: [],
        results: [],
        from,
        to,
        // routesToCalculate: [],
        totals: {
          expectedRoutes: from.length * to.length,
          alreadyExisting: 0,
          expired: 0,
          calculated: 0,
          newResults: 0,
          errors: 0,
          chunks: 0,
        },
      };

      let message;
      let counter = 0;
      for (const from_chunk of from_chunks) {
        for (const to_chunk of to_chunks) {
          counter++;
          message = `running chunk ${counter} / ${from_chunks.length*to_chunks.length}...`;
          stackTrace.push(message);
          console.log(message);
          await this.taskStatusService.updateTask(taskStatus.id, {
            progress: Number(((counter-1)/(from_chunks.length*to_chunks.length) * 100).toFixed(0)),
            detailedStatus: {
              stackTrace
            }
          },user)

          const r = await this.getDistanceResult(
              { from: from_chunk, to: to_chunk, tripName: params.tripName },
              user
          );
          result.errors = result.errors.concat(r.errors);
          result.results = Array.from(new Set(result.results.concat(r.results)));
          result.totals.alreadyExisting += r.totals.alreadyExisting;
          result.totals.expired += r.totals.expired;
          // result.routesToCalculate = Array.from(new Set(result.routesToCalculate.concat(r.routesToCalculate)))
          // result.totals.calculated = result.routesToCalculate.length;
          result.totals.calculated += r.totals.calculated;
          result.totals.newResults += r.totals.newResults;
          result.totals.errors += r.totals.errors;
          result.totals.chunks += r.totals.chunks;

          message = `so far found ${result.results.length}/${result.totals.expectedRoutes}`;
          stackTrace.push(message);
          console.log(message);
          await this.taskStatusService.updateTask(taskStatus.id, {
            progress: Number(((counter)/(from_chunks.length*to_chunks.length) * 100).toFixed(0)),
            detailedStatus: {
              stackTrace
            }
          },user)
        }
      }

      message = `finished`;
      stackTrace.push(message);
      console.log(message);
      await this.taskStatusService.updateTask(taskStatus.id, {
        progress: 100,
        detailedStatus: {
          stackTrace
        }
      },user)

      return result;
    }

    runInBackground();

    return {
      taskId: taskStatus.id
    };
  }

  async getDistanceResult(
    params: GetDistanceResultDto,
    user: User
  ): Promise<CalculateDistancesResult> {
    const { from, to } = params;

    // todo - seek for alternative with nestjs.
    const distance = require("google-distance-matrix");
    const googleKey = "AIzaSyA7I3QU1khdOUoOwQm4xPhv2_jt_cwFSNU";
    distance.key(googleKey);
    const travelMode = distance.options.mode.toUpperCase();

    // get already existing db results, filter out expired ones.
    const expired = [];
    const dbResults = (
      await this.distanceRepository.findDistancesByFromAndTo(
        from,
        to,
        travelMode
      )
    ).filter((r) => {
      const diffInDays =
        (getTimestampInSeconds() - r.addedAt.getTime() / 1000) / SECONDS_IN_DAY;

      const isValid = diffInDays <= DB_DATA_EXPIRY_IN_DAYS;

      if (!isValid) {
        expired.push(r);
      }

      return isValid;
    });

    const originsToCalculate: Record<string, number> = {};
    const destinationsToCalculate = {};
    const routesToCalculate = [];

    from.forEach((f) => {
      to.forEach((t) => {
        if (
          !dbResults.find(
            (d) =>
              d.to === coordinateToString(t) &&
              d.from === coordinateToString(f) &&
              d.travelMode === travelMode
          )
        ) {
          originsToCalculate[coordinateToString(f)] = 1;
          destinationsToCalculate[coordinateToString(t)] = 1;
          routesToCalculate.push(
            JSON.stringify({
              from: f,
              to: t,
              travelMode,
            })
          );
        }
      });
    });

    // const originsToCalculate = from.filter(
    //     (c) => !dbResults.find((d) => JSON.stringify(d.from) === JSON.stringify(c))
    // );
    // const destinationsToCalculate = to.filter(
    //   (c) => !dbResults.find((d) => JSON.stringify(d.to) === JSON.stringify(c))
    // );

    let result: CalculateDistancesResult = {
      results: [],
      errors: [],
      totals: {
        alreadyExisting: 0,
        expired: 0,
        calculated: 0,
        newResults: 0,
        errors: 0,
        chunks: 0,
      },
    };

    let chunks = 0;

    // build params for google api
    if (routesToCalculate.length) {
      const origins = Object.keys(originsToCalculate);
      const destinations = Object.keys(destinationsToCalculate);
      result = await this.distanceRepository.calculateDistances(
        origins,
        destinations,
        distance
      );
      await sleep(1000);
      chunks++;
    }

    for (const r of result.results) {
      const upsertDto = (r as unknown) as CreateDistanceDto;
      await this.distanceRepository.upsertDistance(upsertDto, user);
    }

    // keep errors too so we won't try again.
    for (const r of result.errors) {
      const upsertDto = (r as unknown) as CreateDistanceDto;
      await this.distanceRepository.upsertDistance(upsertDto, user);
    }

    return {
      ...result,
      results: [...result.results, ...dbResults],
      // routesToCalculate,
      totals: {
        alreadyExisting: dbResults.length,
        expired: expired.length,
        calculated: routesToCalculate.length,
        newResults: result.results.length,
        errors: result.errors.length,
        chunks: chunks,
      },
    };
  }

  async getNearbyPlacesByCoordinate(coordinateStr: string, user: User) {
    const coordinate = stringToCoordinate(coordinateStr);
    const results = (
      await this.distanceRepository.getNearbyPlacesByCoordinate(
        coordinate,
        user
      )
    )
      .filter((x) => x.duration && x.from !== x.to)
      .sort((a, b) => {
        return Number(a.duration.value) - Number(b.duration.value)
      });
    
    return results;
  }

  allEventsLocations(allEvents: any[]): Coordinate[] {
    const allLocations = Array.from(
        new Set(
            allEvents
                .filter((x) => x.location?.latitude && x.location?.longitude)
                .map((x) =>
                    JSON.stringify({
                      lat: x.location?.latitude,
                      lng: x.location?.longitude,
                      eventName: x.title,
                    })
                )
        )
    ).map((x) => JSON.parse(x));

    // if there are multiple evnets with same location but different name, take only one of them.
    const filtered: Record<string, any> = {};
    allLocations.forEach((x) => {
      const key = JSON.stringify({ lat: x.lat, lng: x.lng });
      filtered[key] = x;
    });

    return Object.values(filtered);
  }

  async getTripRoutes(tripName: string, user: User, travelMode: TravelMode = 'DRIVING') {
    const trip = await this.tripService.getTripByName(tripName, user);
    const coordinates = this.allEventsLocations(trip.allEvents as unknown as any[]);

    const results = await this.distanceRepository.findDistancesByFromAndTo(coordinates, coordinates, travelMode);
    return {
      total: results.length,
      results
    }
  }
}
