import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
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
import {HistoryService} from "../history/history.service";
import {ImportCalendarEventsDto} from "./dto/import-calendar-events-dto";
import {TripadvisorService} from "../poi/sources/tripadvisor/tripadvisor.service";
import {PlacesPhotosService} from "../places-photos/places-photos.service";
import {CreateDto} from "../places-photos/dto/create-dto";
import {SearchResults} from "../poi/utils/interfaces";
import {extractCategory} from "../poi/utils/utils";
import axios from "axios";

@Injectable()
export class TripService {
  private logger = new Logger("TripService");
  constructor(
    @InjectRepository(TripRepository)
    private tripRepository: TripRepository,
    private backupsService: BackupsService,
    private historyService: HistoryService,
    private tripadvisorService: TripadvisorService,
    private placesPhotosService: PlacesPhotosService
  ) {

  }

  async getTrips(filterDto: ListTripsDto, user: User) {
    return await this.tripRepository.getTrips(filterDto, user);
  }

  async getTripsShort(filterDto: ListTripsDto, user: User) {
    const promises = await Promise.all([
      this.tripRepository.getTripsShort(filterDto, user),
      this.tripRepository.getSharedTripsShort(filterDto, user)
    ]);
    return {
      trips: promises[0],
      sharedTrips: promises[1]
    }
  }

  async getTrip(id: number, user: User, bypassUserCheck: boolean = false) {
    const found = await this.tripRepository.findOne(id);
    if (!found || (found && !bypassUserCheck && found.user.id !== user.id)) {
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
    return this.tripRepository.getTripByName(name, user);
  }

  async autoFillTrip(createTripDto: CreateTripDto, user: User) {
    const promiseMap: Record<string, Promise<any>> = {};
    const keywordToIds: Record<string, number[]> = {};
    const idToKeyword: Record<string, string> = {};

    let totalUpdatedEvents = 0;
    let totalFoundExistingImages = 0;
    let totalFoundNewImages = 0;

    // @ts-ignore
    const searchKeywords = createTripDto.calendarEvents.map((c) => {
      if (!c.images?.length) {
        const keyword = c.location.eventName ?? c.location.address?.split(",")[0]?.trim() ?? c.title.split("|")[0];
        keywordToIds[keyword] = keywordToIds[keyword] || [];
        keywordToIds[keyword].push(c.id);
        idToKeyword[c.id] = keyword;
        return keyword;
      }
    });

    const existingPoisPhotos: Record<string, string> = await this.placesPhotosService.listPOIsByKeywords(searchKeywords, user);
    // console.log({ searchKeywords, existingPoisPhotos })

    searchKeywords.forEach((keyword) => {

      if (existingPoisPhotos[keyword]) {
        totalFoundExistingImages += 1;
        promiseMap[keyword] = Promise.resolve({
          searchKeyword: keyword,
          image: existingPoisPhotos[keyword]
        })
      }

      if (!promiseMap[keyword]) {
        promiseMap[keyword] = this.tripadvisorService.getLocationDetails(keyword);
      }
    });

    const keywordToImage: Record<string, string> = {};
    const results = await Promise.all(Object.values(promiseMap));
    const keepPhotosPromises = [];
    for (let i = 0; i < results.length; i++){
      const searchKeyword: string = results[i].searchKeyword;
      const image: string = results[i].image ?? results[i]?.details?.['thumbnail']?.['photoSizeDynamic']?.['urlTemplate']?.replace("{width}", 400)?.replace("{height}", 400);

      // keep photos
      if (results[i].details) {
        try {
          keepPhotosPromises.push(this.placesPhotosService.createRecord({
            place: searchKeyword,
            photo: image,
            is_poi: true
          } as unknown as CreateDto, user));

          totalFoundNewImages += 1;
        } catch {
        }
      }

      if (image) {
        keywordToImage[searchKeyword] = image;
      } else {
        console.log(`no image found for ${searchKeyword}`);
      }
    }

    // update calendar events
    // @ts-ignore
    createTripDto.calendarEvents.forEach((c) => {
      const keyword = idToKeyword[c.id];
      if (keyword){
        const image = keywordToImage[keyword];
        if (image){
          c.images = image;
          totalUpdatedEvents += 1;
        }
      }
    })

    try {
      await Promise.all(keepPhotosPromises);
    } catch {}

    // @ts-ignore
    const updatedImages = createTripDto.calendarEvents.map((c) => ({ title: c.title, images: c.images }));

    // console.log({
    //   totalUpdatedEvents,
    //   totalFoundExistingImages,
    //   totalFoundNewImages,
    //   keywordToImage,
    //   keywordToIds,
    //   updatedImages
    // })

    return {
      createTripDto,
      autoFillData: {
        totalUpdatedEvents,
        totalFoundExistingImages,
        totalFoundNewImages
      }
    }
  }

  async createTrip(createTripDto: CreateTripDto, user: User, request: Request, raiseError: boolean = true, autoFill = false) {

    let autoFillData;
    if (autoFill) {
      this.logger.log("Performing auto fill for trip...");
      const updatedData = await this.autoFillTrip(createTripDto, user);
      createTripDto = updatedData.createTripDto;
      autoFillData = updatedData.autoFillData;
      this.logger.log("Finished autofill!", JSON.stringify(autoFillData));
    }

    let createdTrip;
    if (raiseError) {
      createdTrip = await this.tripRepository.createTrip(createTripDto, user, request, this.backupsService);
    } else {
      try {
        createdTrip = await this.tripRepository.createTrip(createTripDto, user, request, this.backupsService);
      } catch (error) {
        this.logger.error("trip creation failed:", error)
        return undefined
      }
    }

    return {
      ...createdTrip,
      autoFillData
    };
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

  async importCalendarEvents(name: string, importCalendarEvents: ImportCalendarEventsDto, user: User, request: Request) {
    const trip = await this.getTripByName(name, user);

    // const newCalendarEvents = importCalendarEvents.calendarEvents;
    //
    // const allEvents = trip.allEvents;
    //
    // // @ts-ignore
    // const allEventsIds = allEvents.map((e) => e.id);
    // newCalendarEvents.forEach((e) => {
    //   if (!allEventsIds.includes(e.id)){
    //
    //     // @ts-ignore
    //     allEvents.push(e);
    //   }
    // })
    //
    // // const updateTripDto: Partial<UpdateTripDto> = {
    // //   // @ts-ignore
    // //   calendarEvents: importCalendarEvents.calendarEvents,
    // //   // @ts-ignore
    // //   allEvents: allEvents,
    // //   // @ts-ignore
    // //   sidebarEvents: []
    // // }

    return this.tripRepository.updateTrip(importCalendarEvents as Partial<UpdateTripDto>, trip, user, request, this.backupsService);
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
    await this.tripRepository.keepBackup({id}, trip, request, user, this.backupsService);

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
    const result = await this.tripRepository.delete({ id: trip.id });
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

    // @ts-ignore
    const modifiedTrips = trips.map((trip, idx) => {
      const categories: any[] = trip.categories as unknown as any[];

      if (isVerbose)
        console.log(
            `Analyzing trip #${idx + 1}/${trips.length} - ${trip.name}....`
        );

      let totalErrorsInThisTrip = 0;

      // all events
      // @ts-ignore
      const modifiedAllEvents = ([...trip.calendarEvents, ...trip.sidebarEvents] as any[]).map((event) => {
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

      // @ts-ignore
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

  async toggleLockTrip(name: string, isLocked: boolean, user: User, request: Request) {
      const trip = await this.getTripByName(name, user);
      return this.tripRepository.updateTrip({ isLocked }, trip, user, request, this.backupsService);
    }

  async toggleHideTrip(name: string, isHidden: boolean, user: User, request: Request) {
    const trip = await this.getTripByName(name, user);
    return this.tripRepository.updateTrip({ isHidden }, trip, user, request, this.backupsService);
  }

  getImagesFromAlbums(albumsImages: Record<string, string[]>): string[] {
    const MAX_IMAGES = 10;


    const albumNames = Object.keys(albumsImages);
    const totalAlbums = albumNames.length;

    // If there are fewer than MAX_IMAGES images total, just flatten all images
    // @ts-ignore
    const allImages = albumNames.map(album => albumsImages[album]).flat();
    if (allImages.length <= MAX_IMAGES) {
      return allImages.slice(0, MAX_IMAGES);
    }

    const imagesPerAlbum = Math.min(Math.floor(MAX_IMAGES / totalAlbums), MAX_IMAGES); // Equal amount from each
    let selectedImages: string[] = [];

    // Take up to imagesPerAlbum from each album
    albumNames.forEach(album => {
      const albumImages = albumsImages[album].slice(0, imagesPerAlbum);
      selectedImages = selectedImages.concat(albumImages);
    });

    // If we still need more images, take from albums with extra images
    if (selectedImages.length < MAX_IMAGES) {
      let remainingImages = MAX_IMAGES - selectedImages.length;

      // Find albums that still have extra images to take
      // @ts-ignore
      const extraImages = albumNames.map(album => albumsImages[album].slice(imagesPerAlbum)).flat();

      selectedImages = selectedImages.concat(extraImages.slice(0, remainingImages));
    }

    return selectedImages.slice(0, MAX_IMAGES); // Ensure total doesn't exceed MAX_IMAGES
  }

  async autoFillData(name: string, user: User) {
        const keepOnDb = false;
        const { locationId, details } = await this.tripadvisorService.getLocationDetails(name);
        const tripAdvisorUrl = `${this.tripadvisorService.baseUrl}${details['url']}`;

        this.tripadvisorService.baseUrl = 'https://www.tripadvisor.co.il';
        const { details: details_heb } = await this.tripadvisorService.getLocationDetails(name);

        const geoId = details["url"].split('-').find((p) => p.startsWith("g")).replace("g", "");

        // const baseUrl = this.tripadvisorService.baseUrl;
        //
        // const config = {
        //   headers: {
        //     'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        //     'accept-language': 'en-US,en;q=0.9',
        //     'priority': 'u=0, i',
        //     'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        //     'sec-ch-ua-mobile': '?0',
        //     'sec-ch-ua-platform': '"macOS"',
        //     'sec-fetch-dest': 'document',
        //     'sec-fetch-mode': 'navigate',
        //     'sec-fetch-site': 'none',
        //     'sec-fetch-user': '?1',
        //     'upgrade-insecure-requests': '1',
        //     'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        //     'Cookie': 'TAUnique=%1%enc%3AD%2Fch1%2BQ2hpeH0%2F%2BuCFHlKaolf3ScFFQaXQs0JsPcVadR7t%2FphnBsBy96c2%2FgF6t%2BNox8JbUSTxk%3D; _abck=CFCC95316C817ECEC69FF1FC649B009D~-1~YAAQnYdkX4uFwoiQAQAAnT8XjQwBLqxDq4Ai1z7w+gm5G3e6UDZk4LG3CtOedG+YaTvGdfjSAV6DKjFQIGVWZsx1bEQ5ZkwXxTCaFNxnXI9dF9AXeBt73yMaxdpodaQ+FsQIK4vqbJ2fgBrdYys7nclckPCKrRj1wUfcHMoLALqYLGM1f8NEczfpgxmUeKvCF/lRg7MICv8WjVLCrZok2u/j6xbR/mqOGNpMKmaxfnRA9nCHHtfjMmrJ6qlxT5XAFaH+Htd42adl9ip86kqzFbquCQpyidqCHgL0m0EYOEDV8/t2ETi6DSJmYwK5YT605vI+nh8eAeTQIbQzdo5Xwj5qdrBRR6MKjlV/VLGzHsZ+VloBlyAeD9j3JoTlQNJ8aLRDrw==~-1~-1~-1; datadome=C0NJKBWq2bnr8ezlFAekW1r36c_RqS2qN4USab0EXAaELcli63VCCy~sWVqHXKgiBe3kxKmfoThXbLZFsnkEo7VDEQvt6L4zDjFGrM7SIrPw18uPwFLVe12Lr~PM3hex; TADCID=6xMqF6Ov9aFOlR8PABQCrj-Ib21-TgWwDB4AzTFpg4D2j4gSnblaWjZSX4cn-rEADQ9aP3MwhaoXk8R9y7s6F1Jori2QsQfzjzc; TASID=93D344FADF06E6F013AD88BEBD84D2E2; TASameSite=1; __vt=gtRXwWOOtI4oGVUaABQCjdMFtf3dS_auw5cMBDN7STDUL4BecuVnelJIyqlP18njWqmjQg4R1400eUdI8mBvUC-Ur3ujvjaGP8Qu9kIMrF0gxz5tCTwtlIE7eTEzLYZV0zZTxL53nB6z3TRQryI82CW0aUA'
        //   }
        // };
        //
        // const results = await axios.get(tripAdvisorUrl, config);

        name = details['localizedName'] == details_heb['localizedName'] ? details['localizedName'] : `${details['localizedName']} | ${details_heb['localizedName']}`;

        const moreImages: Record<string, string[]> = await this.tripadvisorService.getPhotos(locationId, geoId)

        const i = this.getImagesFromAlbums(moreImages);

        return {
          // ...details,
          // destination
          name, // todo complete - hebrew
          description: '', // todo complete
          images: [
            details['thumbnail']['photoSizeDynamic']['urlTemplate'].replace('{width}', 400).replace('{height}', 400),
            ...i
          ],
          source: 'TripAdvisor',
          more_info: tripAdvisorUrl,
          category: extractCategory([
              name,
              details['localizedName'],
              details['placeType']
          ]),
          location: {
            latitude: details['latitude'],
            longitude: details['longitude'],
          },

          // todo complete:
          // rate: {
          //   rating: 0,
          //   quantity: 0
          // },

          // todo complete:
          // price: 0,
          // currency: null,

          // todo complete:
          // duration: '01:00'
        }
    }
}
