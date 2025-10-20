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
import axios from 'axios';
import { FileUploadService } from '../file-upload/file-upload.service';
import {HistoryService} from "../history/history.service";
import {ImportCalendarEventsDto} from "./dto/import-calendar-events-dto";
import {TripadvisorService} from "../poi/sources/tripadvisor/tripadvisor.service";
import {PlacesPhotosService} from "../places-photos/places-photos.service";
import {CreateDto} from "../places-photos/dto/create-dto";
import {TEMPLATES_USER_NAME} from "../shared/const";
import {UserService} from "../user/user.service";
import {SaveAsTemplateDto} from "./dto/save-as-template-dto";

@Injectable()
export class TripService {
  private logger = new Logger("TripService");
  constructor(
    @InjectRepository(TripRepository)
    private tripRepository: TripRepository,
    private backupsService: BackupsService,
    private historyService: HistoryService,
    private tripadvisorService: TripadvisorService,
    private placesPhotosService: PlacesPhotosService,
    private userService: UserService,
    private fileUploadService: FileUploadService
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

    // Rewrite images to locally hosted copies when possible
    createTripDto = await this.rewriteImagesToLocal(createTripDto);

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

    // Rewrite images to locally hosted copies when possible
    const rewritten = await this.rewriteImagesToLocal(createTripDto);
    return await this.tripRepository.upsertTrip(rewritten, user, request, this.backupsService);
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

    // Rewrite images to locally hosted copies when possible
    const rewritten = await this.rewriteImagesToLocal(updateTripDto);
    return this.tripRepository.updateTrip(rewritten, trip, user, request, this.backupsService);
  }

  private async rewriteImagesToLocal(dto: UpdateTripDto|CreateTripDto): Promise<UpdateTripDto|CreateTripDto> {
    try {
      const processEvent = async (e: any) => {
        if (!e || !e.images) return e;
        const imagesString: string = e.images;
        const urls = (imagesString || '')
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => !!s);

        // only process first 3 images
        const limited = urls.slice(0, 3);

        const safeTitle = (e.title || 'poi').toString().replace(/[^a-zA-Z0-9.-]/g, '-');
        const coordPart = e?.location?.latitude
          ? `${e.location.latitude}_${e.location.longitude}`
          : undefined;

        const rewrittenUrls = await Promise.all(
          limited.map(async (url: string, i: number) => {
            const shouldDownload = /maps\.googleapis\.com|googleusercontent\.com|google\.com\/maps/i.test(url);
            if (!shouldDownload) {
              return url;
            }

            try {
              const response = await axios.get(url, { responseType: 'arraybuffer' });
              const contentType = response.headers['content-type'] as string | undefined;
              const extension = (contentType && contentType.split('/')[1]) || 'jpg';

              // build deterministic key so future uploads reuse the same object
              const base = coordPart ? `${coordPart}-${safeTitle}` : safeTitle;
              const key = `images/event-images/${base}-${i}.${extension}`;

              const s3Url = await this.fileUploadService.uploadBufferIfNotExists(Buffer.from(response.data), key, contentType);
              return s3Url;
            } catch (err) {
              this.logger.warn(`Failed to download/upload image for event '${e.title}': ${url}`);
              return url;
            }
          })
        );

        e.images = rewrittenUrls.join('\n');
        return e;
      };

      if (dto && (dto as any).calendarEvents && Array.isArray((dto as any).calendarEvents)) {
        // @ts-ignore
        for (let idx = 0; idx < (dto as any).calendarEvents.length; idx++) {
          // @ts-ignore
          (dto as any).calendarEvents[idx] = await processEvent((dto as any).calendarEvents[idx]);
        }
      }

      if (dto && (dto as any).allEvents && Array.isArray((dto as any).allEvents)) {
        // @ts-ignore
        for (let idx = 0; idx < (dto as any).allEvents.length; idx++) {
          // @ts-ignore
          (dto as any).allEvents[idx] = await processEvent((dto as any).allEvents[idx]);
        }
      }

      // sidebarEvents is an object keyed by categoryId -> array of events
      if (dto && (dto as any).sidebarEvents && typeof (dto as any).sidebarEvents === 'object') {
        const sidebar = (dto as any).sidebarEvents as Record<string, any[]>;
        for (const key of Object.keys(sidebar)) {
          const arr = sidebar[key];
          if (Array.isArray(arr)) {
            for (let idx = 0; idx < arr.length; idx++) {
              arr[idx] = await processEvent(arr[idx]);
            }
          }
        }
      }

      return dto;
    } catch (error) {
      this.logger.error('rewriteImagesToLocal failed', error as any);
      return dto;
    }
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
    request: Request,
    rewriteImages: boolean = true
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

    // Rewrite images to locally hosted copies when possible
    const rewritten = rewriteImages ? await this.rewriteImagesToLocal(updateTripDto) : updateTripDto;
    if (rewriteImages) console.log("rewritten", JSON.stringify(rewritten));
    return this.tripRepository.updateTrip(rewritten, trip, user, request, this.backupsService);
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

  async saveAsTemplate(dto: SaveAsTemplateDto, user: User, request: Request) {
    const { tripName, newTripName } = dto;

    // Get the original trip
    let trip = await this.getTripByName(tripName, user);
    if (!trip) {
      trip = await this.getTripByName(tripName.replace('-',' '), user);
      if (!trip) {
        throw new NotFoundException(`Trip with name ${tripName} not found`);
      }
    }

    // Get the templates user
    const templatesUser = await this.userService.getUserByName(TEMPLATES_USER_NAME);
    if (!templatesUser) {
      throw new NotFoundException(`Templates user not found`);
    }

    // Create a copy of the trip data without descriptions
    const tripData: CreateTripDto = {
      name: newTripName, // trip.name,
      dateRange: trip.dateRange,
      categories: trip.categories,
      calendarEvents: JSON.parse(JSON.stringify(trip.calendarEvents)).map((event: any) => ({
        ...event,
        // description: '' // Remove description
      })),
      sidebarEvents: JSON.parse(JSON.stringify(trip.sidebarEvents)),
      allEvents: JSON.parse(JSON.stringify(trip.allEvents)).map((event: any) => ({
        ...event,
        // description: '' // Remove description
      })),
      calendarLocale: trip.calendarLocale,
      destinations: trip.destinations
    };

    // Remove descriptions from sidebar events
    Object.keys(tripData.sidebarEvents).forEach(key => {
      tripData.sidebarEvents[key] = tripData.sidebarEvents[key].map((event: any) => ({
        ...event,
        description: '' // Remove description
      }));
    });

    // is trip exists?
    let isTemplateExists = false;
    try {
      const foundTrip = await this.tripRepository.getTripByName(tripData.name, templatesUser)
      isTemplateExists = !!foundTrip;
    } catch {

    }

    // Create the template trip
    const updatedTrip = await this.tripRepository.upsertTrip(tripData, templatesUser, request, this.backupsService);

    if (isTemplateExists) {
      return {
        "updated": true,
        "trip": updatedTrip
      }
    } else {
      return {
        "created": true,
        "trip": updatedTrip
      }
    }
  }

  async syncTrip(name: string, tripData: CreateTripDto, syncTo: 'remote' | 'local') {
    const remoteServerAddress = syncTo == 'remote' ? 'https://3plan-server.vercel.app' : 'https://nonvolubly-superceremonious-maeve.ngrok-free.dev';
    const signIn = '/auth/signin';
    const getTripByName = `/trip/name/${name}`;
    const updateTripByName = `/trip/name/${name}`;
    const createTrip = '/trip';
  
    try {
      let res, data;
  
      // 1️⃣ Get remote token
      res = await axios.post(remoteServerAddress + signIn, {
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
  
      data = res.data;
      const remoteToken = data.accessToken;
      console.log("thereee", remoteToken);
  
      // 2️⃣ Check if trip exists remotely
      let tripExists: any = null;
      try {
        res = await axios.get(remoteServerAddress + getTripByName, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${remoteToken}`
          },
        });
        tripExists = res.data;
      } catch (err) {
        if (err.response && err.response.status === 404) {
          console.log("trip does not exist remotely");
        } else {
          throw err;
        }
      }
      console.log("trip exist?", !!tripExists);
  
      // 3️⃣ Upsert trip
      if (tripExists) {
        res = await axios.put(remoteServerAddress + updateTripByName, tripData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${remoteToken}`
          },
        });
        data = res.data;
        console.log("upsert result", data);
      } else {
        res = await axios.post(remoteServerAddress + createTrip, tripData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${remoteToken}`
          },
        });
        data = res.data;
        console.log("create result", data);
      }
  
      return data;
    } catch (e) {
      console.error("Sync failed:", e);
      throw e;
    }
  }
}
