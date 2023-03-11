import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  HttpService,
} from "@nestjs/common";
import { ListTripsDto } from "./dto/list-trips-dto";
import { CreateTripDto } from "./dto/create-trip-dto";
import { UpdateTripDto } from "./dto/update-trip-dto";
import { TripRepository } from "./trip.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../user/user.entity";
import {DuplicateTripDto} from "./dto/duplicate-trip-dto";
import {BackupsService} from "../backups/backups.service";
import { Request } from 'express';
import {Trip} from "./trip.entity";
import {BackupsRepository} from "../backups/backups.repository";

@Injectable()
export class TripService {
  private logger = new Logger("TripService");
  constructor(
    @InjectRepository(TripRepository)
    private tripRepository: TripRepository,
    private backupsService: BackupsService,
  ) {

  }

  async getTrips(filterDto: ListTripsDto, user: User) {
    return await this.tripRepository.getTrips(filterDto, user);
  }

  async getTrip(id: number, user: User) {
    const found = await this.tripRepository.findOne(id);
    if (!found || (found && found.user.id !== user.id)) {
      throw new NotFoundException(`Trip with id #${id} not found`);
    }
    return found;
  }

  async getTripByNameFull(name: string) {
    const found = await this.tripRepository.findOne({ name: name });
    if (!found) {
      throw new NotFoundException(`Trip with name ${name} not found`);
    }
    return found;
  }

  async getTripByName(name: string, user: User) {
    return this.tripRepository._getTripByName(name, user);
  }

  async createTrip(createTripDto: CreateTripDto, user: User, request: Request) {
    return await this.tripRepository.createTrip(createTripDto, user, request, this.backupsService);
  }

  async upsertTrip(createTripDto: CreateTripDto, user: User, request: Request) {
    const { name } = createTripDto;

    if (!name) {
      throw new BadRequestException("name : missing");
    }

    return await this.tripRepository.upsertTrip(createTripDto, user, request, this.backupsService);
  }

  async updateTrip(id: number, updateTripDto: UpdateTripDto, user: User, request: Request) {
    const trip = await this.getTrip(id, user);

    // if (
    //   !updateTripDto.name &&
    //   !updateTripDto.logo &&
    //   !updateTripDto.division &&
    //   !updateTripDto.conference
    // ) {
    //   throw new NotFoundException(`You have to pass fields to update`);
    // }

    return this.tripRepository.updateTrip(updateTripDto, trip, user, request, this.backupsService);
  }

  async updateTripByName(
    name: string,
    updateTripDto: UpdateTripDto,
    user: User,
    request: Request
  ) {
    const trip = await this.getTripByName(name, user);

    // if (
    //   !updateTripDto.name &&
    //   !updateTripDto.logo &&
    //   !updateTripDto.division &&
    //   !updateTripDto.conference
    // ) {
    //   throw new NotFoundException(`You have to pass fields to update`);
    // }

    return this.tripRepository.updateTrip(updateTripDto, trip, user, request, this.backupsService);
  }

  async deleteTrip(id: number, user: User, request: Request) {
    const trip = await this.getTrip(id, user);
    if (!trip) {
      throw new NotFoundException(`Trip with id #${id} not found`);
    }

    // backup
    await this.tripRepository.keepBackup({id}, trip, request, user, this.backupsService)

    const result = await this.tripRepository.delete({ id: id });
    if (result.affected === 0) {
      throw new NotFoundException(`Trip with id #${id} not found`);
    }
    return result;
  }

  async deleteTripByName(name: string, user: User, request: Request) {
    const trip = await this.getTripByName(name, user);
    if (!trip) {
      throw new NotFoundException(`Trip with name ${name} not found`);
    }
    const result = await this.tripRepository.delete({ name: trip.name });
    if (result.affected === 0) {
      throw new NotFoundException(`Trip with name "${name}" not found`);
    }
    return result;
  }

  async duplicateTripByName(name: string, duplicateTripDto: DuplicateTripDto, user:User, request: Request) {
    const trip = await this.getTripByName(name, user);
    if (!trip) {
      throw new NotFoundException(`Trip with name ${name} not found`);
    }

    await this.tripRepository.duplicateTripByName(trip, duplicateTripDto, user, request, this.backupsService);
    return await this.getTripByName(duplicateTripDto.newName, user);
  }

  async migrate({ isDryRun = true, name }: { isDryRun?: boolean, name?: string}) {
    const isVerbose = true;

    // Connect to the database
    if (isVerbose) console.log("Connecting to database....\n");

    const tripRepository = this.tripRepository;

    if (isVerbose) console.log("Querying all trips....\n");
    let trips = await this.tripRepository.getAllTripsByPass()

    if (name) {
      trips = trips.filter((x) => x.name === name);
    }

    const changedTripIds = {};
    const totalTripsToFix = {};
    const totalExtendedPropsFixes = [];
    const totalCategoryIdFixes = [];
    const totalOpeningHoursFixes = [];

    const modifiedTrips = trips.map((trip, idx) => {
      const categories: any[] = trip.categories as unknown as any[];

      if (isVerbose)
        console.log(
            `Analyzing trip #${idx + 1}/${trips.length} - ${trip.name}....`
        );

      let totalErrorsInThisTrip = 0;

      // all events
      const modifiedAllEvents = trip.allEvents.map((event) => {
        if (Object.keys(event).includes("extendedProps")) {
          totalExtendedPropsFixes.push({
            id: event.id,
            where: "allEvents",
            event,
          });

          if (!isDryRun) {
            if (event.extendedProps) {
              event = {
                ...event.extendedProps,
                ...event,
              };
              delete event.extendedProps;
            }
          }

          changedTripIds[trip.id] = changedTripIds[trip.id] || 0;
          changedTripIds[trip.id]++;
          totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
          totalTripsToFix[trip.name]++;
          totalErrorsInThisTrip++;
        }

        if (Object.keys(event).includes("categoryId")) {
          totalCategoryIdFixes.push({ id: event.id, where: "allEvents", event });

          let shouldIncreaseCounters = true;
          if (!isDryRun) {
            if (event.categoryId) {
              if (event.category == undefined) {
                event.category = event.categoryId;
              }
              if (event.categoryId == event.category) {
                delete event.categoryId;
              } else {
                if (Number.isNaN(event.category)) {
                  event.category = event.categoryId;
                  delete event.categoryId;
                } else {
                  delete event.categoryId;
                }

                // shouldIncreaseCounters = false;
                console.error(
                    `trip ${trip.name} activity: ${event.title} have two categories: ${event.categoryId}, ${event.category} which are: ${categories.find((x) => x.id == event.categoryId)?.title}, ${categories.find((x) => x.id == event.category)?.title}`
                );
              }
            }
          }
          if (shouldIncreaseCounters) {
            totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
            totalTripsToFix[trip.name]++;
            totalErrorsInThisTrip++;
          }
        }

        if (typeof event.category === "object") {
          if (Object.keys(event["category"]).includes("id")) {
            totalCategoryIdFixes.push({
              id: event.id,
              where: "sidebar",
              event,
            });

            if (!isDryRun) {
              event.category = event.category.id;
            }

            totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
            totalTripsToFix[trip.name]++;
            totalErrorsInThisTrip++;
          }
        }

        if (
            Object.keys(event).includes("openingHours") &&
            event["openingHours"] === "[object Object]"
        ) {
          if (!isDryRun) {
            delete event["openingHours"];
          }
          totalOpeningHoursFixes.push({
            id: event.id,
            where: "allEvents",
            event,
          });
          changedTripIds[trip.id] = changedTripIds[trip.id] || 0;
          changedTripIds[trip.id]++;
          totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
          totalTripsToFix[trip.name]++;
          totalErrorsInThisTrip++;
        }

        return event;
      });

      const modifiedCalendarEvents = trip.calendarEvents.map((event) => {
        if (Object.keys(event).includes("extendedProps")) {
          totalExtendedPropsFixes.push({
            id: event.id,
            where: "calendar",
            event,
          });

          if (!isDryRun) {
            if (event.extendedProps) {
              event = {
                ...event.extendedProps,
                ...event,
              };
              delete event.extendedProps;
            }
          }

          changedTripIds[trip.id] = changedTripIds[trip.id] || 0;
          changedTripIds[trip.id]++;
          totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
          totalTripsToFix[trip.name]++;
          totalErrorsInThisTrip++;
        }

        if (Object.keys(event).includes("categoryId")) {
          totalCategoryIdFixes.push({ id: event.id, where: "calendar", event });
          let shouldIncreaseCounters = true;
          if (!isDryRun) {
            if (event.categoryId) {
              if (event.category == undefined) {
                event.category = event.categoryId;
              }
              if (event.categoryId == event.category) {
                delete event.categoryId;
              } else {
                // shouldIncreaseCounters = false;
                // console.error(
                //     `trip ${trip.name} activity: ${event.title} have two categories: ${event.categoryId}, ${event.category} which are: ${categories.find((x) => x.id == event.categoryId)?.title}, ${categories.find((x) => x.id == event.category)?.title}`
                // );

                if (Number.isNaN(event.category)) {
                  event.category = event.categoryId;
                  delete event.categoryId;
                } else {
                  delete event.categoryId;
                }

                // shouldIncreaseCounters = false;
                console.error(
                    `trip ${trip.name} activity: ${event.title} have two categories: ${event.categoryId}, ${event.category} which are: ${categories.find((x) => x.id == event.categoryId)?.title}, ${categories.find((x) => x.id == event.category)?.title}`
                );
              }
            }
          }
          if (shouldIncreaseCounters) {
            totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
            totalTripsToFix[trip.name]++;
            totalErrorsInThisTrip++;
          }
        }

        if (typeof event.category === "object") {
          if (Object.keys(event["category"]).includes("id")) {
            totalCategoryIdFixes.push({
              id: event.id,
              where: "sidebar",
              event,
            });

            if (!isDryRun) {
              event.category = event.category.id;
            }

            totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
            totalTripsToFix[trip.name]++;
            totalErrorsInThisTrip++;
          }
        }

        if (
            Object.keys(event).includes("openingHours") &&
            event["openingHours"] === "[object Object]"
        ) {
          if (!isDryRun) {
            delete event["openingHours"];
          }
          totalOpeningHoursFixes.push({ id: event.id, where: "calendar", event });
          changedTripIds[trip.id] = changedTripIds[trip.id] || 0;
          changedTripIds[trip.id]++;
          totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
          totalTripsToFix[trip.name]++;
          totalErrorsInThisTrip++;
        }

        return event;
      });

      const modifiedSidebarEvents: Record<number, any[]> = {};
      Object.keys(trip.sidebarEvents).forEach((category_id: string) => {
        // @ts-ignore
        trip.sidebarEvents[Number(category_id)].forEach((event) => {
          modifiedSidebarEvents[Number(category_id)] =
              modifiedSidebarEvents[Number(category_id)] || [];

          if (Object.keys(event).includes("extendedProps")) {
            totalExtendedPropsFixes.push({
              id: event.id,
              where: "sidebar",
              event,
            });

            if (!isDryRun) {
              if (event.extendedProps) {
                event = {
                  ...event.extendedProps,
                  ...event,
                };
                delete event.extendedProps;
              }
            }

            totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
            totalTripsToFix[trip.name]++;
            totalErrorsInThisTrip++;
          }

          if (Object.keys(event).includes("categoryId")) {
            totalCategoryIdFixes.push({
              id: event.id,
              where: "sidebar",
              event,
            });

            let shouldIncreaseCounters = true;
            if (!isDryRun) {
              if (event.categoryId) {
                if (event.category == undefined) {
                  event.category = event.categoryId;
                }
                if (event.categoryId == event.category) {
                  delete event.categoryId;
                } else {
                  if (Number.isNaN(event.category)) {
                    event.category = event.categoryId;
                    delete event.categoryId;
                  } else {
                    delete event.categoryId;
                  }

                  // shouldIncreaseCounters = false;
                  console.error(
                      `trip ${trip.name} activity: ${event.title} have two categories: ${event.categoryId}, ${event.category} which are: ${categories.find((x) => x.id == event.categoryId)?.title}, ${categories.find((x) => x.id == event.category)?.title}`
                  );
                }
              }
            }
            if (shouldIncreaseCounters) {
              totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
              totalTripsToFix[trip.name]++;
              totalErrorsInThisTrip++;
            }
          }

          if (typeof event.category === "object") {
            if (Object.keys(event["category"]).includes("id")) {
              totalCategoryIdFixes.push({
                id: event.id,
                where: "sidebar",
                event,
              });

              if (!isDryRun) {
                event.category = event.category.id;
              }

              totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
              totalTripsToFix[trip.name]++;
              totalErrorsInThisTrip++;
            }
          }

          if (
              Object.keys(event).includes("openingHours") &&
              event["openingHours"] === "[object Object]"
          ) {
            if (!isDryRun) {
              delete event["openingHours"];
            }
            totalOpeningHoursFixes.push({
              id: event.id,
              where: "sidebar",
              event,
            });
            totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
            totalTripsToFix[trip.name]++;
            totalErrorsInThisTrip++;
          }

          modifiedSidebarEvents[category_id].push(event);
        });
      });

      if (!isDryRun) {
        // @ts-ignore
        trip.allEvents = modifiedAllEvents;
        // @ts-ignore
        trip.sidebarEvents = modifiedSidebarEvents;
        // @ts-ignore
        trip.calendarEvents = modifiedCalendarEvents;
      }

      if (isVerbose)
        console.log(
            `... Found ${totalErrorsInThisTrip} things to fix in this trip\n`
        );

      return trip;
    });

    if (!isDryRun) {

      const tripsToBackup = modifiedTrips.filter((trip) => changedTripIds[trip.id]);

      if (isVerbose)
        console.log(
            `Backing Up trips...\n`
        );

      for (let i =0; i< tripsToBackup.length; i++){
        const trip = tripsToBackup[i];
        if (isVerbose)
          console.log(
              `... Backing Up trip #${i+1}/${tripsToBackup.length} - ${trip.name}...\n`
          );

        // @ts-ignore
        await this.tripRepository.keepBackup({}, trip, {
          url: "migration",
          method: "migrate-extendedprops-11-03-2023.ts"
        }, undefined, this.backupsService)
      }

      // Save the modified trips back to the database
      // @ts-ignore
      await tripRepository.save(modifiedTrips);
    }

    // summary
    const summary = {
      [isDryRun ? "tripsToFix" : "fixedTrips"]: totalTripsToFix,
      totalExtended: totalExtendedPropsFixes.length,
      totalCategory: totalCategoryIdFixes.length,
    };
    console.log("Summary:", summary);

    return summary;

    // await queryRunner.manager.save(trips);
  }
}
