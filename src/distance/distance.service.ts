import { Injectable, Logger } from "@nestjs/common";
import { User } from "../user/user.entity";
import { UpsertDistanceDto } from "./dto/upsert-distance.dto";
import {
  coordinateToString,
  getPercentage,
  getTimestampInSeconds,
  getUniqueListOfCoordinates,
  sleep,
  stringToCoordinate,
} from "../shared/utils";
import { InjectRepository } from "@nestjs/typeorm";
import { DistanceRepository } from "./distance.repository";
import { CalcDistancesDto } from "./dto/calc-distances.dto";
import { chunk } from "lodash";
import { TripService } from "../trip/trip.service";
import { TaskService } from "../task/task.service";
import { CreateTaskDto } from "../task/dto/create-task.dto";
import { Coordinate } from "../shared/interfaces";
import { CalculateDistancesResult, TravelMode } from "./common";
import {
  TaskCreatedResult,
  TaskStatus,
  TripRoutesResult,
} from "../task/common";
import { Distance } from "./distance.entity";
import { Task } from "../task/task.entity";

const defaultCalculateDistancesResult = {
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
  numOfGoogleCalls: 0
};

@Injectable()
export class DistanceService {
  private logger = new Logger("DistanceService");

  // consts
  private readonly MAX_IN_CHUNK = 10;
  private readonly DB_DATA_EXPIRY_IN_DAYS = 30;
  private readonly SECONDS_IN_DAY = 86400;

  private travelModes: TravelMode[] = ["DRIVING", "WALKING"]

  constructor(
    @InjectRepository(DistanceRepository)
    private distanceRepository: DistanceRepository,
    private tripService: TripService,
    private taskService: TaskService
  ) {}

  /***
   * Calculate (or return from db) distance results for the given origins and destinations
   * @param params - from: Coordinate[], to: Coordinate[], tripName: string
   * @param user
   */
  async calcDistancesInChunks(
    params: CalcDistancesDto,
    user: User
  ): Promise<TaskCreatedResult> {
    const trip = await this.tripService.getTripByName(params.tripName, user);
    const createTaskDto: CreateTaskDto = CreateTaskDto.build(params, trip);

    const task = await this.taskService.createTask(createTaskDto, user);
    this.logger.log(`task #${task.id} created`);

    // run in background (do not await)
    this._calcDistancesInChunks(params, task, user);

    return {
      taskId: task.id,
    };
  }

  async _calcDistancesInChunks(
    params: CalcDistancesDto,
    task: Task,
    user: User
  ) {
    let numOfGoogleCalls = 0;

    try {
      let { from: _from, to: _to } = params;

      const from = getUniqueListOfCoordinates(_from);
      const to = getUniqueListOfCoordinates(_to);

      // get already existing db results, filter out expired ones.
      const { dbResults, expired } = await this._getDBResults(params);

      const from_chunks = chunk(from, this.MAX_IN_CHUNK);
      const to_chunks = chunk(to, this.MAX_IN_CHUNK);

      const result = {
        ...defaultCalculateDistancesResult,
        from,
        to,
        totals: {
          ...defaultCalculateDistancesResult.totals,
          expectedRoutes: from.length * to.length * this.travelModes.length,
        },
      };

      let counter = 0;
      const totalChunks = from_chunks.length * to_chunks.length;

      for (const from_chunk of from_chunks) {
        for (const to_chunk of to_chunks) {
          counter++;
          this.logger.log(
            `[${user.id}::${user.username}] running chunk ${counter} / ${totalChunks}...`
          );
          await this.taskService.updateTask(
            task.id,
            {
              status:
                counter === 1 ? TaskStatus.PENDING : TaskStatus.IN_PROGRESS,
              progress: getPercentage(counter - 1, totalChunks),
              detailedStatus: { chunk: counter, totalChunks },
              numOfGoogleCalls
            },
            user
          );

          const r = await this._calcDistances(
            { from: from_chunk, to: to_chunk, tripName: params.tripName },
            user,
            dbResults,
            expired,
            numOfGoogleCalls
          );

          numOfGoogleCalls = r.numOfGoogleCalls;

          result.errors = result.errors.concat(r.errors);
          result.results = Array.from(
            new Set(result.results.concat(r.results))
          );
          result.totals.alreadyExisting += r.totals.alreadyExisting;
          result.totals.expired += r.totals.expired;
          result.totals.calculated += r.totals.calculated;
          result.totals.newResults += r.totals.newResults;
          result.totals.errors += r.totals.errors;
          result.totals.chunks += r.totals.chunks;

          this.logger.log(
            `[${user.id}::${user.username}] so far found ${result.results.length}/${result.totals.expectedRoutes}`
          );
        }
      }

      this.logger.log(`[${user.id}::${user.username}] finished`);
      await this.taskService.updateTask(
        task.id,
        {
          status: TaskStatus.SUCCEEDED,
          progress: 100,
          detailedStatus: {
            chunk: counter,
            totalChunks,
          },
          numOfGoogleCalls
        },
        user
      );

      return result;
    } catch (e) {
      await this.taskService.updateTask(
        task.id,
        {
          status: TaskStatus.FAILED,
          detailedStatus: {
            error: e,
          },
          numOfGoogleCalls
        },
        user
      );

      throw e;
    }
  }

  async _getDBResults(
    params: CalcDistancesDto,
    travelMode?: TravelMode
  ): Promise<{ dbResults: Distance[]; expired: Distance[] }> {
    const { from, to } = params;

    const expired = [];
    let dbResults = await this.distanceRepository.findDistancesByFromAndTo(
      from,
      to,
      travelMode
    );

    dbResults = dbResults.filter((r) => {
      const diffInDays =
        (getTimestampInSeconds() - r.addedAt.getTime() / 1000) /
        this.SECONDS_IN_DAY;

      const isValid = diffInDays <= this.DB_DATA_EXPIRY_IN_DAYS;

      if (!isValid) {
        expired.push(r);
      }

      return isValid;
    });

    return {
      dbResults,
      expired,
    };
  }

  _isExistsInDB(
    from: Coordinate,
    to: Coordinate,
    travelMode: TravelMode,
    dbResults: Distance[]
  ): boolean {
    const idx = dbResults.findIndex(
      (d) =>
        d.to == coordinateToString(to) &&
        d.from == coordinateToString(from) &&
        d.travelMode === travelMode
    );

    return idx !== -1;
  }

  _getDistanceResultKey(
    from: Coordinate,
    to: Coordinate,
    travelMode: TravelMode
  ) {
    return JSON.stringify({
      from,
      to,
      travelMode,
    });
  }

  async _calcDistances(
    params: CalcDistancesDto,
    user: User,
    dbResults: Distance[] | undefined = undefined,
    expired: Distance[] | undefined = undefined,
    numOfGoogleCalls: number
  ): Promise<CalculateDistancesResult> {

    const routesToCalculate = [];
    let result: CalculateDistancesResult = defaultCalculateDistancesResult;
    let chunks = 0;

    for (let i=0; i< this.travelModes.length; i++) {
      const travelMode = this.travelModes[i];

      // todo - seek for alternative with nestjs.
      const distance = require("google-distance-matrix");
      const googleKey = "AIzaSyA7I3QU1khdOUoOwQm4xPhv2_jt_cwFSNU";
      distance.key(googleKey);
      distance.options.mode = travelMode.toLowerCase();

      // get already existing db results, filter out expired ones.
      if (dbResults == undefined || expired == undefined) {
        const query = await this._getDBResults(params, travelMode);
        dbResults = query.dbResults;
        expired = query.expired;
      }

      // build list of routes we need to calculate
      const { from, to } = params;
      const originsToCalculate: Record<string, number> = {};
      const destinationsToCalculate = {};

      from.forEach((f) => {
        to.forEach((t) => {
          if (!this._isExistsInDB(t, f, travelMode, dbResults)) {
            console.log(
                `from:${coordinateToString(f)} to:${coordinateToString(t)} travel: ${travelMode} does not exist`
            );
            originsToCalculate[coordinateToString(f)] = 1;
            destinationsToCalculate[coordinateToString(t)] = 1;
            routesToCalculate.push(
              this._getDistanceResultKey(f, t, travelMode)
            );
          }
        });
      });

      // build params for google api
      if (routesToCalculate.length) {
        console.error("getting routes via Google");
        const origins = Object.keys(originsToCalculate);
        const destinations = Object.keys(destinationsToCalculate);
        result = await this.distanceRepository.calculateDistances(
          origins,
          destinations,
          distance,
            numOfGoogleCalls
        );
        numOfGoogleCalls = result.numOfGoogleCalls;
        await sleep(1000);
        chunks++;
      }

      // upsert db for all returned results
      for (const r of result.results) {
        const upsertDto = (r as unknown) as UpsertDistanceDto;
        await this.distanceRepository.upsertDistance(upsertDto, user);
      }

      // keep errors too so we won't try again.
      for (const r of result.errors) {
        const upsertDto = (r as unknown) as UpsertDistanceDto;
        await this.distanceRepository.upsertDistance(upsertDto, user);
      }
    }

    return {
      ...result,
      results: [...result.results, ...dbResults],
      totals: {
        alreadyExisting: dbResults.length,
        expired: expired.length,
        calculated: routesToCalculate.length,
        newResults: result.results.length,
        errors: result.errors.length,
        chunks: chunks,
      },
      numOfGoogleCalls
    };
  }

  async getNearbyPlacesByCoordinate(
    coordinateStr: string,
    user: User
  ): Promise<Distance[]> {
    const coordinate = stringToCoordinate(coordinateStr);
    const results = await this.distanceRepository.getNearbyPlacesByCoordinate(
      coordinate,
      user
    );
    return results
      .filter((x) => x.duration && x.from !== x.to)
      .sort((a, b) => {
        return Number(a.duration.value) - Number(b.duration.value);
      });
  }

  _extractEventsUniqueLocations(allEvents: any[]): Coordinate[] {
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

  async getTripRoutes(
    tripName: string,
    user: User,
    travelMode?: TravelMode
  ): Promise<TripRoutesResult> {
    const trip = await this.tripService.getTripByName(tripName, user);

    const calendarEvents: any[] = (trip.calendarEvents as unknown) as any[];
    const sidebarEvents: Record<
      string,
      any[]
    > = (trip.sidebarEvents as unknown) as Record<string, any[]>;

    const allEvents = [
      // @ts-ignore
      ...Object.values(sidebarEvents).flat(),
      ...calendarEvents,
    ];

    const coordinates = this._extractEventsUniqueLocations(allEvents);
    const results = await this.distanceRepository.findDistancesByFromAndTo(
      coordinates,
      coordinates,
      travelMode
    );

    return {
      total: results.length,
      results,
    };
  }
}
