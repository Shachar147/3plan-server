import {Injectable, Logger} from '@nestjs/common';
import {BaseSourceService} from "../base-source-service";
import {SearchResults} from "../utils/interfaces";
import axios from "axios";
import {SearchDto} from "../dto/search-dto";
import {convertTime} from "../utils/utils";

@Injectable()
export class GetYourGuideService implements BaseSourceService{

    private source = "GetYourGuide"
    private currency = "ILS";
    private language = "he"; // en-US
    private visitorId = "R4QUTT0XNY3NLKXQILFA90DXMBH4B9L6";
    private logger = new Logger("GetYourGuideService");
    constructor() {
    }

    format(destination: string, json: Record<string, any>){
        const moreInfoLink = json["onClickLink"]?.["link"];
        const activityCard = json["onImpressionTrackingEvent"]?.["properties"]?.["activity_card"];
        const description = activityCard?.["activity_abstract"];
        const rating = activityCard?.["review_statistics"]
        const duration = activityCard?.["attributes"]?.find((a) => a["type"] == "duration")?.["label"];
        return {
            name: json["title"],
            destination,
            description,
            images: json["images"],
            source: this.source,
            more_info: moreInfoLink ? `https://www.getyourguide.com/${moreInfoLink}` : undefined,
            category: "", // todo complete
            duration: duration != undefined ? convertTime(duration) : undefined,
            //
            addedat: new Date().getTime(),
            status: "active"
        }
    }

    async getLocationId(destination: string) {

        const response = await axios.get(`https://travelers-api.getyourguide.com/search/v2/suggest?suggestEntities=location,activity,synthetic_trip_item,trip_item_group&q=${destination}`, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-currency': 'ILS',
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
        return response.data["suggestions"]?.[0]?.["locationId"];
    }

    async search({ destination, page = 1 }: SearchDto): Promise<SearchResults> {
        const locationId = await this.getLocationId(destination);
        if (!locationId) {
            return {
                results: [],
                isFinished: true
            }
        }
        const response = await axios.post(
            "https://travelers-api.getyourguide.com/user-interface/landing-pages/blocks",
            {
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

        // Extracting the data from the response
        const results = response.data["content"][0]["content"];
        const isFinished = response.data["content"].length == 1;
        const nextPage = isFinished ? undefined : page + 1;
        return {
            results: results.map((r) => this.format(destination, r)),
            nextPage,
            isFinished
        };
    }
}
