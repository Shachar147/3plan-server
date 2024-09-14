import {Injectable, Logger} from '@nestjs/common';
import {BaseSourceService} from "../base-source-service";
import {SearchResults} from "../../utils/interfaces";
import axios from "axios";
import {SearchDto} from "../../dto/search-dto";
import {convertTime, extractCategory} from "../../utils/utils";
import {PointOfInterestService} from "../../poi.service";
import {User} from "../../../user/user.entity";

@Injectable()
export class GetYourGuideService implements BaseSourceService{

    private source = "GetYourGuide"
    private currency = "ILS";
    private language = "he"; // en-US
    private visitorId = "R4QUTT0XNY3NLKXQILFA90DXMBH4B9L6";
    private logger = new Logger("GetYourGuideService");

    constructor(
        private poiService: PointOfInterestService
    ) {
    }

    formatOld(destination: string, json: Record<string, any>){
        const moreInfoLink = json["onClickLink"]?.["link"];
        const activityCardMetaData = JSON.parse(json["onClickTrackingEvent"]?.["properties"]?.["metadata"] ?? "{}")?.["activity_card"];

        const activityCard = json["onImpressionTrackingEvent"]?.["properties"]?.["activity_card"];
        const description = activityCard?.["activity_abstract"];
        const rating = activityCard?.["review_statistics"]
        const duration = activityCard?.["attributes"]?.find((a) => a["type"] == "duration")?.["label"];
        const price = activityCard?.["price"]?.["starting_price"];
        const location = activityCardMetaData?.["coordinates"];
        // const category = activityCardMetaData?.["categoryLabel"];

        const name = json["title"];

        const category = extractCategory([
            name,
            description
        ]);
        const priority = JSON.stringify(json).includes("top pick") || JSON.stringify(json).includes("bestseller") ? "high" : undefined;
        return {
            name,
            destination,
            description,
            images: json["images"],
            videos: json["videos"], // ?
            source: this.source,
            more_info: moreInfoLink ? `https://www.getyourguide.com${moreInfoLink}` : undefined,
            duration: duration != undefined ? convertTime(duration) : undefined,
            category,
            icon: undefined, // ?
            openingHours: undefined, // ?
            priority,
            location, // ?
            rate: rating,
            //
            addedAt: new Date().getTime(),
            status: "active",
            isVerified: true, // ?
            price,
            currency: this.currency,
            extra: {
                price,
                currency: this.currency
            }
        }
    }

    // todo: modify FORMAT to the new link:
    // todo: verify syntax, compare to what we currently have on db.
    format(destination: string, json: Record<string, any>){
        const moreInfoLink = json["url"];
        const description = json["abstract"];
        let rating = json["reviewStatistics"]?.["rating"]
        rating = rating ? `${Number(rating).toFixed(2)}/5` : undefined;
        const duration = json["duration"] ? `${json["duration"]["min"]} - ${json["duration"]["max"]} ${json["duration"]["units"]}` : undefined;
        const price = json?.["price"]?.["startingPrice"];
        const location = json["coordinates"];
        const name = json["title"];
        // const category = activityCardMetaData?.["categoryLabel"];
        const category = extractCategory([
            name,
            description
        ]);
        const priority = undefined; // ?
        return {
            name,
            destination,
            description,
            images: json["images"],
            videos: json["videos"], // ?
            source: this.source,
            more_info: moreInfoLink ? `https://www.getyourguide.com${moreInfoLink}` : undefined,
            duration: duration != undefined ? convertTime(duration) : undefined,
            category, // todo modify?
            //
            icon: undefined, // ?
            openingHours: undefined, // ?
            priority,
            location, // ?
            rate: rating,
            //
            addedAt: new Date().getTime(),
            status: "active",
            isVerified: true, // ?
            price,
            currency: this.currency,
            extra: {
                price,
                currency: this.currency,
            }
        }
    }

    async getLocationId(destination: string): Promise<{ locationId: string | undefined, destination: string}>  {

        const response = await axios.get(`https://travelers-api.getyourguide.com/search/v2/suggest?suggestEntities=location,activity,synthetic_trip_item,trip_item_group&q=${destination}`, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-currency': this.currency,
                'accept-language': 'en-US',
                'geo-ip-country': 'IL',
                'origin': 'https://www.getyourguide.com',
                'partner-id': 'CD951',
                'priority': 'u=1, i',
                'referer': 'https://www.getyourguide.com/',
                'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'visitor-id': this.visitorId,
                'visitor-platform': 'desktop',
                'x-gyg-app-type': 'Web',
                'x-gyg-geoip-country': 'IL',
                'x-gyg-partner-hash': 'CD951'
            }
        });
        // console.log("results:", response.data);

        // Extracting the data from the response
        return {
            locationId: response.data["suggestions"]?.[0]?.["locationId"],
            destination: response.data["suggestions"]?.[0]?.["type"] == "location" ? response.data["suggestions"]?.[0]?.["suggestion"] : destination
        };
    }

    async searchOld({ destination, page = 1 }: SearchDto, user: User): Promise<SearchResults> {
        page = Number(page);
        const { locationId, destination: _destination } = await this.getLocationId(destination);
        destination = _destination;
        if (!locationId) {
            return {
                results: [],
                isFinished: true,
                source: this.source
            }
        }
        const response = await axios.post(
            "https://travelers-api.getyourguide.com/user-interface/landing-pages/blocks",
            {
                events: [
                    {
                        "event": {
                            "type": "sortingSelected",
                            "emitterId": "tabbing-activities-section",
                            "payload": {
                                "value": "rating_desc"
                            }
                        }
                    }
                ],
                // Request body (data)
                payload: {
                    locationId: locationId,
                    sortingSelected: "popularity",
                    filtersSelected: [],
                    page,
                    contentIdentifier: "activities-reloadable-content",
                    additionalParams: {},
                    injectedCardsCount: 0
                }
            },
            {
                // Headers
                headers: {
                    "accept": "application/json, text/plain, */*",
                    "accept-currency": this.currency,
                    "accept-language": this.language,
                    "content-type": "application/json",
                    "geo-ip-country": "IL",
                    "partner-id": "CD951",
                    "priority": "u=1, i",
                    "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"macOS\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    "visitor-id": this.visitorId,
                    "visitor-platform": "desktop",
                    "x-gyg-app-type": "Web",
                    "x-gyg-geoip-city": "Tel Aviv",
                    "x-gyg-geoip-country": "IL",
                    "x-gyg-partner-cmp": "brand",
                    "x-gyg-partner-hash": "CD951",
                    "x-gyg-referrer": "https://www.getyourguide.com/",
                    "x-gyg-time-zone": "Asia/Jerusalem",
                    "Referer": "https://www.getyourguide.com/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                }
            }
        );

        if (!response.data){
            this.logger.log(`no results for ${destination}; page: ${page}; source: ${this.source}`)
            return {
                results: [],
                nextPage: undefined,
                isFinished: true,
                source: this.source
            };
        }

        // Extracting the data from the response
        let results = response.data["content"][0]["content"];
        const isFinished = response.data["content"].length == 1;
        const nextPage = isFinished ? undefined : page + 1;

        results = results.map((r) => this.formatOld(destination, r))

        // keep on db
        results = await this.poiService.upsertAllIds(results, user);

        return {
            results,
            nextPage,
            isFinished,
            source: this.source
        };
    }

    async search({ destination, page = 1 }: SearchDto, user: User): Promise<SearchResults> {
        page = Number(page);
        const { locationId, destination: _destination } = await this.getLocationId(destination);
        destination = _destination;
        if (!locationId) {
            return {
                results: [],
                isFinished: true,
                source: this.source
            }
        }
        const response = await axios.get(
            `https://travelers-api.getyourguide.com/locations/${locationId}/nearest-activities?limit=300&page=${page}`,
            {
                // Headers
                headers: {
                    "accept": "application/json, text/plain, */*",
                    "accept-currency": this.currency,
                    "accept-language": this.language,
                    "content-type": "application/json",
                    "geo-ip-country": "IL",
                    "partner-id": "CD951",
                    "priority": "u=1, i",
                    "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"macOS\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    "visitor-id": this.visitorId,
                    "visitor-platform": "desktop",
                    "x-gyg-app-type": "Web",
                    "x-gyg-geoip-city": "Tel Aviv",
                    "x-gyg-geoip-country": "IL",
                    "x-gyg-partner-cmp": "brand",
                    "x-gyg-partner-hash": "CD951",
                    "x-gyg-referrer": "https://www.getyourguide.com/",
                    "x-gyg-time-zone": "Asia/Jerusalem",
                    "Referer": "https://www.getyourguide.com/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                }
            }
        );

        // Extracting the data from the response
        let results = response.data["activities"]["items"];
        const isFinished = page * 300 > response.data["activities"]["total"];
        const nextPage = isFinished === true ? undefined : page + 1;

        results = results.map((r) => this.format(destination, r));

        // keep on db
        results = await this.poiService.upsertAllIds(results, user);

        return {
            nextPage,
            isFinished,
            results,
            source: this.source
        };
    }
}
