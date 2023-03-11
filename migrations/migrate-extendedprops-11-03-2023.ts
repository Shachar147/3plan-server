#!/usr/bin/env node

// how to run?
//
// 1. running dry run on specific trip:
// ts-node ./migrations/migrate-extendedprops-11-03-2023.js --name="AMS-BER"
//
// 2. running wet run on this trip:
// ts-node ./migrations/migrate-extendedprops-11-03-2023.js --dryrun=false --name="AMS-BER"
//
// 3. running dry run on all trips:
// ts-node ./migrations/migrate-extendedprops-11-03-2023.js

// Import necessary modules and packages
const { Trip } = require("../src/trip/trip.entity");
const { User } = require("../src/user/user.entity");
const { Distance } = require("../src/distance/distance.entity");
const { Backups } = require("../src/backups/backups.entity");
const { createConnection } = require("typeorm");

// Define the configuration settings for your database connection
const dbConfig = {
  type: "postgres",
  host: "localhost",
  username: "postgres",
  password: "postgres",
  port: 5432,
  database: "triplan",
};

// todo complete - remove also openingHours OBJECT OBJECT

// Define the logic for your script
async function migrate() {
  const args = require("minimist")(process.argv.slice(2), {
    alias: {
      n: "name",
      v: "verbose",
      d: "dryrun",
    },
    boolean: ["verbose", "dryrun"],
    string: ["name"],
    default: {
      dryrun: true, // Set default value for dryrun to true
    },
  });

  const isDryRun = !!args["dryrun"];
  const isVerbose = !!args.verbose;
  const name = args["name"];

  // Connect to the database
  if (isVerbose) console.log("Connecting to database....\n");
  const connection = await createConnection({
    ...dbConfig,
    entities: [Trip, User, Distance, Backups],
  });

  const tripRepository = connection.getRepository(Trip);

  if (isVerbose) console.log("Querying all trips....\n");
  let trips = await connection.query("SELECT * FROM trip");

  if (name) {
    trips = trips.filter((x) => x.name === name);
  }

  const totalTripsToFix = {};
  const totalExtendedPropsFixes = [];
  const totalCategoryIdFixes = [];
  const totalOpeningHoursFixes = [];

  const modifiedTrips = trips.map((trip, idx) => {
    const { categories } = trip;

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
              // console.error(
              //     `trip ${trip.name} activity: ${event.title} have two categories: ${event.categoryId}, ${event.category} which are: ${categories.find((x) => x.id == event.categoryId)?.title}, ${categories.find((x) => x.id == event.category)?.title}`
              // );

              // shouldIncreaseCounters = false;
              // console.error(
              //   `trip ${trip.name} activity: ${event.title} have two categories: ${event.categoryId}, ${event.category} which are: ${categories.find((x) => x.id == event.categoryId)?.title}, ${categories.find((x) => x.id == event.category)?.title}`
              // );
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
              // console.error(
              //     `trip ${trip.name} activity: ${event.title} have two categories: ${event.categoryId}, ${event.category} which are: ${categories.find((x) => x.id == event.categoryId)?.title}, ${categories.find((x) => x.id == event.category)?.title}`
              // );
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
        totalTripsToFix[trip.name] = totalTripsToFix[trip.name] || 0;
        totalTripsToFix[trip.name]++;
        totalErrorsInThisTrip++;
      }

      return event;
    });

    const modifiedSidebarEvents: Record<number, any[]> = {};
    Object.keys(trip.sidebarEvents).forEach((category_id: string) => {
      trip.sidebarEvents[category_id].forEach((events) => {
        modifiedSidebarEvents[category_id] =
          modifiedSidebarEvents[category_id] || [];
        Array.from(events).forEach((event: any) => {
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
                  // console.error(
                  //     `trip ${trip.name} activity: ${event.title} have two categories: ${event.categoryId}, ${event.category} which are: ${categories.find((x) => x.id == event.categoryId)?.title}, ${categories.find((x) => x.id == event.category)?.title}`
                  // );
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
    });

    if (!isDryRun) {
      trip.allEvents = modifiedAllEvents;
      trip.sidebarEvents = modifiedSidebarEvents;
      trip.calendarEvents = modifiedCalendarEvents;
    }

    if (isVerbose)
      console.log(
        `... Found ${totalErrorsInThisTrip} things to fix in this trip\n`
      );

    return trip;
  });

  if (!isDryRun) {
    // Save the modified trips back to the database
    await tripRepository.save(modifiedTrips);
  }

  // summary
  console.log("Summary:", {
    [isDryRun ? "tripsToFix" : "fixedTrips"]: totalTripsToFix,
    totalExtended: totalExtendedPropsFixes.length,
    totalCategory: totalCategoryIdFixes.length,
  });

  // await queryRunner.manager.save(trips);
}

migrate();

// Export any functions or objects that you want to be able to use in other scripts or modules
module.exports = { migrate };
