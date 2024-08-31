import {Injectable, Logger} from '@nestjs/common';
import {BaseSourceService} from "../base-source-service";
import {SearchResults} from "../../utils/interfaces";
import axios from "axios";
import {SearchDto} from "../../dto/search-dto";
import {convertTime} from "../../utils/utils";
import {PointOfInterestService} from "../../poi.service";
import {User} from "../../../user/user.entity";

@Injectable()
export class TripadvisorService implements BaseSourceService{

    private source = "TripAdvisor"
    private currency = "ILS";
    private language = "he"; // en-US
    // private visitorId = "R4QUTT0XNY3NLKXQILFA90DXMBH4B9L6";
    private logger = new Logger("TripAdvisorService");

    private baseUrl = 'https://www.tripadvisor.com'; // 'https://www.tripadvisor.co.il';

    constructor(
        private poiService: PointOfInterestService
    ) {
    }

    extractCategory(arr) {
        const categoryToKeywordMapping = {
            "CATEGORY.ATTRACTIONS": [
                "Studio Tour",
                "hiking",
                "hikes",
                "dive",
                " Terme ",
                "skypool",
                "Dubai: Desert",
                "Waterpark",
                "Yacht Tour",
                "Dubai: Safari",
                "Show Tickets",
                "Zip Line",
                "Helicopter Flight",
                "The Green Planet",
                "Adventure",
                "Desert Safari",
                "Dubai Snow",
                "Ferrari World",
                "Superyacht",
                "jet ski",
                "Adventure",
                "Cruise",
                "Boat Tours",
                "Parasailing",
                "Boat Rentals",
                "Diving",
                "Kayaking",
                "Full-day Tours",
                "Yoga Classes",
                "Paddleboarding",
                "snorkeling",
                "paddle surf",
                "boat trip",
                "Buggy Excursion",
            ],
            "CATEGORY.NATURE": [
                "picnic",
                "flowers garden",
                "forest",
                "mountains"
            ],
            "CATEGORY.TOURISM": ["city-walk", "burj", "מסגד", "טיילת", "המרינה", "אייפל", "eifel", "souk", "שווקים", "Historical Tours"],
            "CATEGORY.VIEWS": ["sky view", "תצפית", "dubai frame"],
            "CATEGORY.BARS_AND_NIGHTLIFE": ["dance club", "lounge", "club"],
            "CATEGORY.PARKS": ["פארק"],
            "CATEGORY.CITIES": ["עיירה", "עיירות"],
            "CATEGORY.BEACHES": ["beach "],
            "CATEGORY.BEACH_BARS": ["beach bar"],
            "CATEGORY.MUSEUMS": ["Museum"],
            "CATEGORY.HOTELS": [
                "six senses",
                "sixsenses",
                "hotel",
                "resort",
                "בית מלון",
                "המלון",
            ],
            "CATEGORY.FOOD": ["restaurant", "cafe", "מסעדה", "chocolate", "croissants", "food", "drink"],
        };
        let toReturn = "";

        let matchedCategories = [];
        Object.keys(categoryToKeywordMapping).forEach((category) => {
            arr.forEach((str) => {
                categoryToKeywordMapping[category].forEach((keyword) => {
                    if (str.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) {
                        // toReturn = category;
                        matchedCategories.push(category);
                        // return toReturn;
                    }
                });
                // if (toReturn !== "") {
                //     // return toReturn;
                // }
            });
            if (matchedCategories.length > 0){
                if (matchedCategories.includes("בתי מלון") && matchedCategories.length > 1) {
                    matchedCategories = matchedCategories.filter((i) => i != "בתי מלון");
                }
                toReturn = matchedCategories[0];
                return matchedCategories[0]
            }
            // if (toReturn !== "") {
            //     return toReturn;
            // }
        });
        return toReturn;
    }

    format(destination: string, json: Record<string, any>){
        const data = json["singleFlexCardContent"];

        const moreInfoLink = data["cardLink"]?.["webRoute"]?.["webLinkUrl"]

        const title = data?.["cardTitle"]?.["text"];

        let description = data?.["descriptiveText"]?.["text"]?.["text"];
        const haveDescription = (description?.length ?? 0) > 0;

        if (!haveDescription) {
            description = data?.["reviewSnippets"]?.[0]?.["reviewSnippet"]?.["text"]?.["text"].replace("  ", " ") ?? "";
            description = description.split(" ").map((a) => a.replace("\t","").replace("\r","").replace("\n","")).filter((a) => a.length).join(" ");// description = "";
        } else {
            if (data["languageDetails"]) {
                description += "\n\nAvailable on languages:" + data["languageDetails"].map((x) => x["text"]).join(", ");
            }
        }
        let rateVal = data?.["bubbleRating"]?.["rating"] ?? 0;
        const rating = {
            "rating": rateVal,
            "quantity": data?.["bubbleRating"]?.["numberReviews"]?.text.replace(",","")
        }
        let duration = data?.["duration"]?.["text"].replace("+", "").replace("–"," - ");
        duration = duration != undefined ? convertTime(duration) : undefined;
        let price = data?.["price"]?.["text"];
        let currency = this.currency;
        if (price) {
            price = price.replace("$","").replace("₪", "");
        } else if (data?.["trackingKey"]) {
            try {
                const trackingData = JSON.parse(data?.["trackingKey"]);
                price = trackingData["prc"];
                currency = trackingData["cur"];
            } catch {

            }
        }
        const location = ""; // activityCardMetaData?.["coordinates"];
        // const category = activityCardMetaData?.["categoryLabel"];
        const category = this.extractCategory([
            title,
            description,
            data?.["primaryInfo"]?.["text"] ?? ""
        ]);

        const priority = rating.rating == 5 && Number(rating.quantity) > 1000 ? "high" : undefined;

        const imgInfo = data?.["cardPhoto"]?.["sizes"];
        const images = [];
        if (imgInfo) {
            images.push(data?.["cardPhoto"]?.["sizes"]?.["urlTemplate"].replace("{width}", "2000").replace("{height}", "1500"));
        }

        return {
            name: title,
            destination,
            description,
            images,
            videos: [],
            source: this.source,
            more_info: moreInfoLink ? `${this.baseUrl}${moreInfoLink}` : undefined,
            duration,
            category,
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
            currency: currency,
            extra: {
                price,
                currency: currency
            }
        }
    }

    async getLocationId(destination: string): Promise<{ locationId: string | undefined, destination: string}>  {

        const data = JSON.stringify([
            {
                "variables": {
                    "request": {
                        "query": destination,
                        "limit": 10,
                        "scope": "IN_GEO_EXTEND_WORLDWIDE",
                        "locale": "en-US",
                        "scopeGeoId": "123",
                        "searchCenter": null,
                        "types": [
                            "LOCATION",
                            "QUERY_SUGGESTION",
                            "RESCUE_RESULT"
                        ],
                        "locationTypes": [
                            "GEO",
                            "AIRPORT",
                            "ACCOMMODATION",
                            "ATTRACTION",
                            "ATTRACTION_PRODUCT",
                            "EATERY",
                            "NEIGHBORHOOD",
                            "AIRLINE",
                            "SHOPPING",
                            "UNIVERSITY",
                            "GENERAL_HOSPITAL",
                            "PORT",
                            "FERRY",
                            "CORPORATION",
                            "VACATION_RENTAL",
                            "SHIP",
                            "CRUISE_LINE",
                            "CAR_RENTAL_OFFICE"
                        ],
                        "userId": null,
                        "context": {
                            "searchSessionId": "00160f2b9255c191.ssid",
                            "typeaheadId": "1720120592350",
                            "uiOrigin": "SINGLE_SEARCH_NAV",
                            "routeUid": "fa55fe93-3885-4ae4-a347-685a7909f870"
                        },
                        "enabledFeatures": [
                            "articles",
                            "NESTED_RESULTS"
                        ],
                        "includeRecent": false
                    }
                },
                "extensions": {
                    "preRegisteredQueryId": "1a0c07013c55f891"
                }
            }
        ]);

        const config = {
            headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9,he;q=0.8',
                'content-type': 'application/json',
                'cookie': '_lc2_fpi=b140173de591--01gt429gejrkxt413pqa652v0a; _ga=GA1.1.638195325.1689358016; TASameSite=1; TAUnique=%1%enc%3A0bPt1DAbYLIqESpYS80bugE8%2B5kuzt268t5VIrI2MPcjSQ4AgGj8MYa8cLRVZTbhNox8JbUSTxk%3D; TASSK=enc%3AAL9%2FMo7e0LFaHvbB4kNE6KtR7Ii3NAFypprnC7ot6mhaZn9rdNcrDztNHuC3QAdjtblZSysSh4o5%2BmxIqMBt8jjSWRiYaIyD78WQKEe2OT%2BW99oEwcmfzaQiOOwv57BBsA%3D%3D; VRMCID=%1%V1*id.10568*llp.%2FSmartDeals-g295424-Dubai_Emirate_of_Dubai-Hotel-Deals%5C.html*e.1718974228161; TATrkConsent=eyJvdXQiOiJTT0NJQUxfTUVESUEiLCJpbiI6IkFEVixBTkEsRlVOQ1RJT05BTCJ9; _gcl_au=1.1.1974327381.1718369431; pbjs_sharedId=653f5e58-fe42-49cb-a99a-9a5da5a0cc87; pbjs_sharedId_cst=zix7LPQsHA%3D%3D; _lc2_fpi_meta=%7B%22w%22%3A1718369435081%7D; _lr_env_src_ats=false; pbjs_unifiedID=%7B%22TDID%22%3A%225c2f933c-fe19-45d0-9e85-0f04151db2c3%22%2C%22TDID_LOOKUP%22%3A%22TRUE%22%2C%22TDID_CREATED_AT%22%3A%222024-05-14T12%3A50%3A42%22%7D; pbjs_unifiedID_cst=zix7LPQsHA%3D%3D; _abck=CFCC95316C817ECEC69FF1FC649B009D~-1~YAAQmGZWuH9ZigWQAQAAG7hqGAw1G81hLvPtNnYpsdPDVnVMqUHty4Of8teGN2ohn+hfQvK1cABMF2Lp6k0HRgfVrJRwFq2jCV7queW0GGjXGcpDQmrAhgahGVoqr9H5pkKVh0BtW354uRpq4L5JZL0urEKcZufhizLEKy5YGqQmMzcDUvVSYstKNUSe7Tkm6AKryzl3pdZLvNpbRoql2yEMx+P6kql4TMKq+YrmtlQ8YXXjJDStVEYIRgwPoUlSvcAq80GKL69ptELTqfPDvo+O21tIcGiyFyaORCFc7ZBpKX17I0rlf/qEMqb0h55iQREQjDXXF/ID3LbbMSaWsg9gwKJ1pvMrkbhNyzEjUC2Ek3en9OjIS9edOyMTNGrvTfq9AK2K8cXDToEm1W0cWn1ZtG8SE3DY2unrjGdA~-1~-1~-1; TADCID=vABVZEUnJbuklgaTABQCmq6heh9ZSU2yA8SXn9Wv5H6sygO29ODrAxdSu1PynECUa5Kka-hWD393xzh9FJCRHfSt978Ns7zgbl0; TASID=BE0DD5C98F094E8CEBEF9FB5BF52EBB7; PAC=AG-BWOZazVkEsgIyRv5VUANLY_f4Shr7zKWLCJSW5eJXT-ChAFqKq_31koB5UYehGQvNE54uEUjNnZO9wR_B-uSfFx3rbE0Okxspe7amRpp996pNuzkYxCTI4Wh-ZeLUCxZSgAYxp3pgf3e1tsivVUtNX4dNLDAf2VHdrsPruCGxPxpuE2aZ3hm_C94a6dMts8z5x2o5wpd_HP_OZgtHrXk%3D; TART=%1%enc%3AacB1OBrvcdiX91CQe8UUWjZtUu8yeRrwKH8dpdaX369zUgJZMudUDpl88bVjzUV6MiviWETFWp4%3D; _li_dcdm_c=.tripadvisor.com; _lr_sampling_rate=100; _lr_retry_request=true; pbjs_li_nonid=%7B%7D; pbjs_li_nonid_cst=zix7LPQsHA%3D%3D; ServerPool=C; PMC=V2*MS.72*MD.20240614*LD.20240704; TATravelInfo=V2*A.2*MG.-1*HP.2*FL.3*RS.1; CM=%1%mds%2C1720120391622%2C1720206791%7C; TAUD=LA-1720120391622-1*ARC-1*RDD-2-2024_07_04; __vt=wV90oL7kvSNiDHnQABQCwRB1grfcRZKTnW7buAoPsS6Kb2LSQEc2s06mxG9OESRyrnnscuealHt8EbYns3DiNCgUQBC-7v8x33_7LmWPhh6OHqiJ_QPPxAnJcWxJ5ZZNXZPr3r93RnLJy1XFuni2bkru; __gads=ID=66a69a46b8e21b64:T=1718369436:RT=1720120475:S=ALNI_MZjmygAUKC3s81bj9XdFj5F8wfjCA; __gpi=UID=00000e3a96c5fbe2:T=1718369436:RT=1720120475:S=ALNI_MYw9d2pn0a3N4lRHQ7_Z-whAwkLXg; __eoi=ID=89724796ff128a3b:T=1718369436:RT=1720120475:S=AA-AfjY8p-1xJWCJNvn3cTJxAJ4T; SRT=TART_SYNC; OptanonConsent=isGpcEnabled=0&datestamp=Thu+Jul+04+2024+22%3A16%3A26+GMT%2B0300+(Israel+Daylight+Time)&version=202310.2.0&isIABGlobal=false&hosts=&consentId=50840adb-3b0a-48eb-bc5d-16751d4d4b76&interactionCount=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1&AwaitingReconsent=false&browserGpcFlag=0; datadome=VIo3YmicSe15E2hjl2NUKi3kiLiGXbRVzP8W9pTRUXftQwAlhyuEtfI41nTyr_qB1xrjDeMrJAI2MDS9TpdkK8nJCsh~l5~IxznW5RiM91Eo~eocQDITgl33fpK_GcCa; _gcl_aw=GCL.1720120588.null; ab.storage.deviceId.6e55efa5-e689-47c3-a55b-e6d7515a6c5d=%7B%22g%22%3A%225e259853-1479-e243-c1ef-2917192fcb99%22%2C%22c%22%3A1718369430721%2C%22l%22%3A1720120588179%7D; ab.storage.sessionId.6e55efa5-e689-47c3-a55b-e6d7515a6c5d=%7B%22g%22%3A%224bdd6774-ee2d-7c67-ae00-fe17ca836115%22%2C%22e%22%3A1720120603183%2C%22c%22%3A1720120588178%2C%22l%22%3A1720120588183%7D; TASession=V2ID.BE0DD5C98F094E8CEBEF9FB5BF52EBB7*SQ.8*LS.Tourism*HS.recommended*ES.popularity*DS.5*SAS.popularity*FPS.oldFirst*FA.1*DF.0*TRA.true; _ga_QX0Q50ZC9P=GS1.1.1720120153.4.1.1720120589.35.0.0; _abck=CFCC95316C817ECEC69FF1FC649B009D~-1~YAAQmGZWuMLHCn6QAQAAmHk0fwymRKhQTFRSJrbBY4r2uEnq9SNnNTLjl3OpKpKEkL4HqjtSfhHOQoVu5gx6LwqDkv+2rCmlGfrKSdMz3QdCRq+uPsOVPx8fRddVf1jzqbGAj1T8fqAQyfNxVBEEL+860FiSH51LdR2dKB+kGjGgn6dkc/yaio7rEGTHFTJEmirh8PMtbcoXjQdHRxReS2LenC+vAZzFsfCF4937UrwnLH8eukXosXu9ndTeXhZwiE1bSqFP5IfRzohHtaaYS0URMJ5JizcguLbb3aWgSiFJGwkGFJCMNo6j/Vw9ILsPJHWTL0HZCIiwNr093o+/3MWHf8on6+gsOKJfhkc0hdnIEzD6W+OVtXLE7mGkEL2MTJv2LA==~-1~-1~-1; bm_sz=FF12E6F80D1B33100714398F1344B890~YAAQmGZWuOa6Cn6QAQAAtPszfxgMMGBxT4gW+c7Gn189yDlSYmVeYjBy9wjfOFwBVtCPMM6Wkv0obj/JgPTRhzRQmDDX8j94AUiUPvpZNYy/wLFytVQ0CGcaUcWBIvTF3FdP1IGAjLG7FsSHAPti6PvWhvXnpNt3hk6QNr9MWXDrd/MoIbrNAYPlR6U53I8gDN/qdLDW2xMuqDMOE7t7yCIh3C3pXaBUoqE1SES4f4aX/JF7VXCeYTXcR7BIDnFy5mzWRWDgyxyBnqN04zyfVi6z3hEWo3ZwkyBUwy7pAMT1nE4QhwcWEZy1/XHQz+pdL8BRohxmYsZYbVGD7UX46HPweJD893axOY+TG9QfqDalgRQ=~3289924~3621939; __vt=Hn9WC6LizniqBrWKABQCwRB1grfcRZKTnW7buAoPsS6KeVuDhE2KlfnHQw_IIxHYdDrhMVKOTGa-K-MqbYwWHauBqS81MJzxI6w8pDSnJQy3pwgQ7i0IokgqF4Ox0xPtgWV6ZbakbM5VUAj7WAdGbuQ6',
                'origin': this.baseUrl,
                'priority': 'u=1, i',
                'referer': this.baseUrl,
                'sec-ch-device-memory': '8',
                'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-full-version-list': '"Not/A)Brand";v="8.0.0.0", "Chromium";v="126.0.6478.127", "Google Chrome";v="126.0.6478.127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'same-origin',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
            },
        };

        const response = await axios.post(`${this.baseUrl}/data/graphql/ids`, data, config);
        return {
            locationId: response.data[0].data["Typeahead_autocomplete"]?.["results"]?.[0]?.["locationId"],
            destination:
                response.data[0].data["Typeahead_autocomplete"]?.["results"]?.[0]?.["details"]?.["placeType"] == "MUNICIPALITY" ?
                response.data[0].data["Typeahead_autocomplete"]?.["results"]?.[0]?.["details"]?.["localizedName"] ?? destination : destination
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

        // const data = JSON.stringify([
        //     {
        //         "variables": {
        //             "navigations": {
        //                 "clientRequestTimestampMs": 1720123237180,
        //                 "request": [
        //                     {
        //                         "eventTimestampMs": 1720123237180,
        //                         "fromPage": "AttractionsFusion",
        //                         "fromParams": [
        //                             {
        //                                 "key": "pagee",
        //                                 "value": "0"
        //                             },
        //                             {
        //                                 "key": "geoId",
        //                                 "value": `${locationId}`
        //                             },
        //                             {
        //                                 "key": "contentType",
        //                                 "value": "attraction"
        //                             },
        //                             {
        //                                 "key": "webVariant",
        //                                 "value": "AttractionsFusion"
        //                             }
        //                         ],
        //                         "fromPath": "/",
        //                         "fromRoute": `{"page":"AttractionsFusion","params":{"pagee":"0","geoId":${locationId},"contentType":"attraction","webVariant":"AttractionsFusion"},"path":"/","fragment":""}`,
        //                         "identifierType": "TA_PERSISTENTCOOKIE",
        //                         "navigationType": "USER_INITIATED",
        //                         "opaqueIds": [],
        //                         "origin": "https://www.tripadvisor.com",
        //                         "referrer": "https://www.tripadvisor.com/",
        //                         "toPage": "AttractionsFusion",
        //                         "toParams": [
        //                             {
        //                                 "key": "pagee",
        //                                 "value": `${30 * (page-1)}`
        //                             },
        //                             {
        //                                 "key": "geoId",
        //                                 "value": `${locationId}`
        //                             },
        //                             {
        //                                 "key": "contentType",
        //                                 "value": "attraction"
        //                             },
        //                             {
        //                                 "key": "webVariant",
        //                                 "value": "AttractionsFusion"
        //                             },
        //                             {
        //                                 "key": "sort",
        //                                 "value": "undefined"
        //                             },
        //                             {
        //                                 "key": "filters",
        //                                 "value": "[]"
        //                             }
        //                         ],
        //                         "toPath": "/",
        //                         "toRoute": `{"page":"AttractionsFusion","params":{"pagee":"${30 * page}","geoId":${locationId},"contentType":"attraction","webVariant":"AttractionsFusion","filters":[]},"path":"/","fragment":""}`,
        //                         "uid": "0e4eca8c-513c-43c3-b3be-760895c9fd86",
        //                         "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        //                     }
        //                 ]
        //             }
        //         },
        //         "extensions": {
        //             "preRegisteredQueryId": "8f5c28f35caeff98"
        //         }
        //     },
        //     {
        //         "variables": {
        //             "events": [
        //                 {
        //                     "schemaName": "user_navigated",
        //                     "eventJson": "{\"producer_ref\":\"ta-web-domain\",\"uid\":\"0e4eca8c-513c-43c3-b3be-760895c9fd86\",\"identifiers\":{},\"navigation_type\":\"USER_INITIATED\",\"user_agent\":\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36\",\"origin\":\"https://www.tripadvisor.com\",\"referrer\":\"https://www.tripadvisor.com/Attractions-g187460-Activities-oa0-Ibiza_Balearic_Islands.html\",\"from_route\":{\"page\":\"AttractionsFusion\",\"params\":{\"pagee\":\"0\",\"geoId\":187460,\"contentType\":\"attraction\",\"webVariant\":\"AttractionsFusion\"},\"path\":\"/Attractions-g187460-Activities-oa0-Ibiza_Balearic_Islands.html\",\"fragment\":\"\"},\"to_route\":{\"page\":\"AttractionsFusion\",\"params\":{\"pagee\":\"30\",\"geoId\":187460,\"contentType\":\"attraction\",\"webVariant\":\"AttractionsFusion\",\"filters\":[]},\"path\":\"/\",\"fragment\":\"\"},\"client_timestamp\":\"2024-07-04T20:00:37.181Z\"}"
        //                 }
        //             ]
        //         },
        //         "extensions": {
        //             "preRegisteredQueryId": "636d0b9184b2fc29"
        //         }
        //     },
        //     {
        //         "variables": {
        //             "pageName": "AttractionsFusion",
        //             "relativeUrl": "/",
        //             "parameters": [
        //                 {
        //                     "key": "pagee",
        //                     "value": `${30 * page}`
        //                 },
        //                 {
        //                     "key": "geoId",
        //                     "value": `${locationId}`
        //                 },
        //                 {
        //                     "key": "contentType",
        //                     "value": "attraction"
        //                 },
        //                 {
        //                     "key": "webVariant",
        //                     "value": "AttractionsFusion"
        //                 },
        //                 {
        //                     "key": "sort",
        //                     "value": "undefined"
        //                 },
        //                 {
        //                     "key": "filters",
        //                     "value": ""
        //                 }
        //             ],
        //             "route": {
        //                 "page": "AttractionsFusion",
        //                 "params": {
        //                     "pagee": `${30 * page}`,
        //                     "geoId": locationId,
        //                     "contentType": "attraction",
        //                     "webVariant": "AttractionsFusion",
        //                     "filters": []
        //                 }
        //             },
        //             "routingLinkBuilding": false
        //         },
        //         "extensions": {
        //             "preRegisteredQueryId": "211573a2b002568c"
        //         }
        //     },
        //     {
        //         "variables": {
        //             "page": "AttractionsFusion",
        //             "pos": "en-US",
        //             "parameters": [
        //                 {
        //                     "key": "pagee",
        //                     "value": `${30 * page-1}`
        //                 },
        //                 {
        //                     "key": "geoId",
        //                     "value": `${locationId}`
        //                 },
        //                 {
        //                     "key": "contentType",
        //                     "value": "attraction"
        //                 },
        //                 {
        //                     "key": "webVariant",
        //                     "value": "AttractionsFusion"
        //                 },
        //                 {
        //                     "key": "sort",
        //                     "value": "undefined"
        //                 },
        //                 {
        //                     "key": "filters",
        //                     "value": ""
        //                 }
        //             ],
        //             "factors": [
        //                 "TITLE",
        //                 "META_DESCRIPTION",
        //                 "MASTHEAD_H1",
        //                 "MAIN_H1",
        //                 "IS_INDEXABLE",
        //                 "RELCANONICAL"
        //             ],
        //             "route": {
        //                 "page": "AttractionsFusion",
        //                 "params": {
        //                     "pagee": `${30 * page}`,
        //                     "geoId": locationId,
        //                     "contentType": "attraction",
        //                     "webVariant": "AttractionsFusion",
        //                     "filters": []
        //                 }
        //             },
        //             "currencyCode": this.currency
        //         },
        //         "extensions": {
        //             "preRegisteredQueryId": "18d4572907af4ea5"
        //         }
        //     },
        //     {
        //         "variables": {
        //             "uid": "LIT@kHRZjpNcG7kShmTlMOIu",
        //             "sessionId": "BE0DD5C98F094E8CEBEF9FB5BF52EBB7",
        //             "currency": this.currency,
        //             "sessionType": "DESKTOP",
        //             "locationId": locationId,
        //             "page": "AttractionsFusion"
        //         },
        //         "extensions": {
        //             "preRegisteredQueryId": "fa5da6ee0b1deed3"
        //         }
        //     },
        //     {
        //         "variables": {
        //             "locationId": locationId,
        //             "uid": "LIT@kHRZjpNcG7kShmTlMOIu",
        //             "sessionId": "BE0DD5C98F094E8CEBEF9FB5BF52EBB7",
        //             "currency": this.currency
        //         },
        //         "extensions": {
        //             "preRegisteredQueryId": "42bec0ee6ec0bfd1"
        //         }
        //     },
        //     {
        //         "variables": {
        //             "page": "AttractionsFusion",
        //             "params": [
        //                 {
        //                     "key": "pagee",
        //                     "value": `${page * 30}`
        //                 },
        //                 {
        //                     "key": "geoId",
        //                     "value": `${locationId}`
        //                 },
        //                 {
        //                     "key": "contentType",
        //                     "value": "attraction"
        //                 },
        //                 {
        //                     "key": "webVariant",
        //                     "value": "AttractionsFusion"
        //                 },
        //                 {
        //                     "key": "sort",
        //                     "value": "undefined"
        //                 },
        //                 {
        //                     "key": "filters",
        //                     "value": ""
        //                 }
        //             ],
        //             "route": {
        //                 "page": "AttractionsFusion",
        //                 "params": {
        //                     "pagee": `${page * 30}`,
        //                     "geoId": locationId,
        //                     "contentType": "attraction",
        //                     "webVariant": "AttractionsFusion",
        //                     "filters": []
        //                 }
        //             }
        //         },
        //         "extensions": {
        //             "preRegisteredQueryId": "f742095592a84542"
        //         }
        //     },
        //     {
        //         "variables": {
        //             "params": {
        //                 "pagee": `${page * 30}`,
        //                 "geoId": locationId,
        //                 "contentType": "attraction",
        //                 "webVariant": "AttractionsFusion",
        //                 "filters": []
        //             },
        //             "page": "AttractionsFusion",
        //             "fragment": ""
        //         },
        //         "extensions": {
        //             "preRegisteredQueryId": "a26bffd43d0e25b6"
        //         }
        //     },
        //     {
        //         "variables": {
        //             "mediaIds": [
        //                 724385941
        //             ]
        //         },
        //         "extensions": {
        //             "preRegisteredQueryId": "da600a978c121a46"
        //         }
        //     },
        //     {
        //         "variables": {
        //             "request": {
        //                 "tracking": {
        //                     "screenName": "AttractionsFusion",
        //                     "pageviewUid": "LIT@kHRZjpNcG7kShmTlMOIu"
        //                 },
        //                 "routeParameters": {
        //                     "geoId": locationId,
        //                     "pagee": `${page * 30}`,
        //                     "contentType": "attraction",
        //                     "webVariant": "AttractionsFusion",
        //                     "filters": []
        //                 },
        //                 "updateToken": null
        //             },
        //             "commerce": {
        //                 "attractionCommerce": {
        //                     "pax": [
        //                         {
        //                             "ageBand": "ADULT",
        //                             "count": 2
        //                         }
        //                     ]
        //                 }
        //             },
        //             "tracking": {
        //                 "screenName": "AttractionsFusion",
        //                 "pageviewUid": "LIT@kHRZjpNcG7kShmTlMOIu"
        //             },
        //             "sessionId": "BE0DD5C98F094E8CEBEF9FB5BF52EBB7",
        //             "unitLength": "MILES",
        //             "currency": this.currency,
        //             "currentGeoPoint": null,
        //             "mapSurface": false,
        //             "debug": false,
        //             "polling": false
        //         },
        //         "extensions": {
        //             "preRegisteredQueryId": "be424059b81703a7"
        //         }
        //     }
        // ]);

        const config = {
            headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9,he;q=0.8',
                'content-type': 'application/json',
                'cookie': '_lc2_fpi=b140173de591--01gt429gejrkxt413pqa652v0a; _ga=GA1.1.638195325.1689358016; TASameSite=1; TAUnique=%1%enc%3A0bPt1DAbYLIqESpYS80bugE8%2B5kuzt268t5VIrI2MPcjSQ4AgGj8MYa8cLRVZTbhNox8JbUSTxk%3D; TASSK=enc%3AAL9%2FMo7e0LFaHvbB4kNE6KtR7Ii3NAFypprnC7ot6mhaZn9rdNcrDztNHuC3QAdjtblZSysSh4o5%2BmxIqMBt8jjSWRiYaIyD78WQKEe2OT%2BW99oEwcmfzaQiOOwv57BBsA%3D%3D; VRMCID=%1%V1*id.10568*llp.%2FSmartDeals-g295424-Dubai_Emirate_of_Dubai-Hotel-Deals%5C.html*e.1718974228161; TATrkConsent=eyJvdXQiOiJTT0NJQUxfTUVESUEiLCJpbiI6IkFEVixBTkEsRlVOQ1RJT05BTCJ9; _gcl_au=1.1.1974327381.1718369431; pbjs_sharedId=653f5e58-fe42-49cb-a99a-9a5da5a0cc87; pbjs_sharedId_cst=zix7LPQsHA%3D%3D; _lc2_fpi_meta=%7B%22w%22%3A1718369435081%7D; _lr_env_src_ats=false; pbjs_unifiedID=%7B%22TDID%22%3A%225c2f933c-fe19-45d0-9e85-0f04151db2c3%22%2C%22TDID_LOOKUP%22%3A%22TRUE%22%2C%22TDID_CREATED_AT%22%3A%222024-05-14T12%3A50%3A42%22%7D; pbjs_unifiedID_cst=zix7LPQsHA%3D%3D; TADCID=vABVZEUnJbuklgaTABQCmq6heh9ZSU2yA8SXn9Wv5H6sygO29ODrAxdSu1PynECUa5Kka-hWD393xzh9FJCRHfSt978Ns7zgbl0; TASID=BE0DD5C98F094E8CEBEF9FB5BF52EBB7; PAC=AG-BWOZazVkEsgIyRv5VUANLY_f4Shr7zKWLCJSW5eJXT-ChAFqKq_31koB5UYehGQvNE54uEUjNnZO9wR_B-uSfFx3rbE0Okxspe7amRpp996pNuzkYxCTI4Wh-ZeLUCxZSgAYxp3pgf3e1tsivVUtNX4dNLDAf2VHdrsPruCGxPxpuE2aZ3hm_C94a6dMts8z5x2o5wpd_HP_OZgtHrXk%3D; TART=%1%enc%3AacB1OBrvcdiX91CQe8UUWjZtUu8yeRrwKH8dpdaX369zUgJZMudUDpl88bVjzUV6MiviWETFWp4%3D; _li_dcdm_c=.tripadvisor.com; _lr_sampling_rate=100; _lr_retry_request=true; pbjs_li_nonid=%7B%7D; pbjs_li_nonid_cst=zix7LPQsHA%3D%3D; ServerPool=C; PMC=V2*MS.72*MD.20240614*LD.20240704; TATravelInfo=V2*A.2*MG.-1*HP.2*FL.3*RS.1; SRT=TART_SYNC; __vt=q2Rm8Dzb9WVZUm5QABQCwRB1grfcRZKTnW7buAoPsS6KmvRkhrz1YofeyDtPO-guZF3NsVwxO7-Y_X2t1O9zYoMEmBQVM7UgrJzsjLohLPflgIgeCln9WIYkoUNLTYjEbdXV3ZWuuavJgJG_DP8eCxXP; __gads=ID=66a69a46b8e21b64:T=1718369436:RT=1720123024:S=ALNI_MZjmygAUKC3s81bj9XdFj5F8wfjCA; __gpi=UID=00000e3a96c5fbe2:T=1718369436:RT=1720123024:S=ALNI_MYw9d2pn0a3N4lRHQ7_Z-whAwkLXg; __eoi=ID=89724796ff128a3b:T=1718369436:RT=1720123024:S=AA-AfjY8p-1xJWCJNvn3cTJxAJ4T; CM=%1%mds%2C1720123119380%2C1720209519%7C; TAUD=LA-1720120391622-1*RDD-2-2024_07_04*LG-2727759-2.1.F.*LD-2727760-.....*ARC-2727761; OptanonConsent=isGpcEnabled=0&datestamp=Thu+Jul+04+2024+23%3A00%3A20+GMT%2B0300+(Israel+Daylight+Time)&version=202310.2.0&isIABGlobal=false&hosts=&consentId=50840adb-3b0a-48eb-bc5d-16751d4d4b76&interactionCount=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1&AwaitingReconsent=false&browserGpcFlag=0; _gcl_aw=GCL.1720123221.null; TASession=V2ID.BE0DD5C98F094E8CEBEF9FB5BF52EBB7*SQ.16*LS.Attractions*HS.recommended*ES.popularity*DS.5*SAS.popularity*FPS.oldFirst*FA.1*DF.0*TRA.true; datadome=U6wmnjw9CGMLBMDOq9O6XSrKcyQEPqLNHYBO3jaXDbAOheW1VZkDl_aOa~YC_Isb5xuy_uC7rrSbQHDLoeIOwY1SzEWMTHB2467G5LPyr5K7b6mpdUTxxdfckARcD5Gs; _abck=CFCC95316C817ECEC69FF1FC649B009D~-1~YAAQIihDFxPpQ3WQAQAAoZpVfww5sW/UzjdgtaEKRUl3fPJj0Or6ZAqDJ5U4aKhK6Y3tET0GiGD7wRQseJyhl6KQmAHfCJILNNSJ5W2HsQzaM5w5/4XFZSICd4G4+v6XANbdozOsksaLnRLJJ0Eu/09AzmiQyO1m20gRdJGuW0q6WleJcVwhCd23eioh/cNZ6/ATgQ5qGvq7yN//MmHNT1mXQNZnAZg+YxkHFwU/LofP8lq+M4+KZGEelj4dlubPwQ7+KyDhvvgrn2gtSmIhNM1RPcPlqTSGRm6s2qpFQhsv2AopgtfoO+BN10csOClrJppgolBzz8CFFOkwXoyhxP6PO7JhQF4MYjFVlJTsn+Mk+6gUtkQMs2yLYCm5IaiotTg7TQ==~-1~-1~-1; ab.storage.sessionId.6e55efa5-e689-47c3-a55b-e6d7515a6c5d=%7B%22g%22%3A%221945d33e-532d-7943-dff4-092b09db4f0a%22%2C%22e%22%3A1720123252333%2C%22c%22%3A1720123237333%2C%22l%22%3A1720123237333%7D; ab.storage.deviceId.6e55efa5-e689-47c3-a55b-e6d7515a6c5d=%7B%22g%22%3A%225e259853-1479-e243-c1ef-2917192fcb99%22%2C%22c%22%3A1718369430721%2C%22l%22%3A1720123237334%7D; _ga_QX0Q50ZC9P=GS1.1.1720120153.4.1.1720123237.31.0.0; _abck=CFCC95316C817ECEC69FF1FC649B009D~-1~YAAQ19XOF3ycZnqQAQAATzZBfww7GNhhb/2krsqQkvcw+0dcsBNbga4UGT4U9Lu6i88DM7unD7HndaedVUvHHiQDi8nPnrSpzGXP1Y3AhI1h/ZmSCGl+Mzkov2Nyj8tLduV85WzD2MpRRIAXMBZ/Bua6vcZ2nmOADPWHMncvswhzCBTg9gkCbhy2G+S++nOfcol0zdeq6CDzKww1YNqLayos5eR7R5HCe5QvyZDFDPClNMSL6xxvz7TBIkowzQngDWwzjNvswc6knjR+zP0tCfp7VGMYx8pW8W0wLoIadYF2qP2FJTZnGFfoWgayA2vaS/Zr/sTMBcPIDzyBa8ckaXXoZGqPDEKaPbwBEsYXUbR/0x7L9PF/qisQqUUXMpRXk1zppA==~-1~-1~-1; bm_sz=FF12E6F80D1B33100714398F1344B890~YAAQmGZWuOa6Cn6QAQAAtPszfxgMMGBxT4gW+c7Gn189yDlSYmVeYjBy9wjfOFwBVtCPMM6Wkv0obj/JgPTRhzRQmDDX8j94AUiUPvpZNYy/wLFytVQ0CGcaUcWBIvTF3FdP1IGAjLG7FsSHAPti6PvWhvXnpNt3hk6QNr9MWXDrd/MoIbrNAYPlR6U53I8gDN/qdLDW2xMuqDMOE7t7yCIh3C3pXaBUoqE1SES4f4aX/JF7VXCeYTXcR7BIDnFy5mzWRWDgyxyBnqN04zyfVi6z3hEWo3ZwkyBUwy7pAMT1nE4QhwcWEZy1/XHQz+pdL8BRohxmYsZYbVGD7UX46HPweJD893axOY+TG9QfqDalgRQ=~3289924~3621939; __vt=SftNhQPN5csouwBTABQCwRB1grfcRZKTnW7buAoPsS6KmP3E9dt3O6Jm9RHYgJvPmzx8yL1k1A61Kv5lt64a5ciU0Vm8oRMh-fcgwRkvaZ3UciC0C3-oQ07r7u83ZZmhBJ70MHw6iw-VG47--AN8ezEE',
                'origin': this.baseUrl,
                'priority': 'u=1, i',
                'referer': `${this.baseUrl}/Attractions-g187460-Activities-oa0-Ibiza_Balearic_Islands.html`,
                'sec-ch-device-memory': '8',
                'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-full-version-list': '"Not/A)Brand";v="8.0.0.0", "Chromium";v="126.0.6478.127", "Google Chrome";v="126.0.6478.127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'same-origin',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
            },
        };


        const data = JSON.stringify([
            {
                "variables": {
                    "navigations": {
                        "clientRequestTimestampMs": 1720336364632,
                        "request": [
                            {
                                "eventTimestampMs": 1720336364632,
                                "fromPage": "AttractionsFusion",
                                "fromParams": [
                                    {
                                        "key": "geoId",
                                        "value": `${locationId}`
                                    },
                                    {
                                        "key": "filters",
                                        "value": "[{\"value\":[\"42\"],\"id\":\"category\"}]"
                                    },
                                    {
                                        "key": "contentType",
                                        "value": "attraction"
                                    },
                                    {
                                        "key": "webVariant",
                                        "value": "AttractionsFusion"
                                    }
                                ],
                                "fromPath": "/Attractions-g187460-Activities-c42-Ibiza_Balearic_Islands.html",
                                "fromRoute": "{\"page\":\"AttractionsFusion\",\"params\":{\"geoId\":187460,\"filters\":[{\"value\":[\"42\"],\"id\":\"category\"}],\"contentType\":\"attraction\",\"webVariant\":\"AttractionsFusion\"},\"path\":\"/Attractions-g187460-Activities-c42-Ibiza_Balearic_Islands.html\",\"fragment\":\"\"}",
                                "identifierType": "TA_PERSISTENTCOOKIE",
                                "navigationType": "USER_INITIATED",
                                "opaqueIds": [],
                                "origin": this.baseUrl,
                                "referrer": `${this.baseUrl}/Attractions-g187460-Activities-c42-Ibiza_Balearic_Islands.html`,
                                "toPage": "AttractionsFusion",
                                "toParams": [
                                    {
                                        "key": "geoId",
                                        "value": `${locationId}`
                                    },
                                    {
                                        "key": "filters",
                                        "value": "[{\"id\":\"category\",\"value\":[\"42\"]}]"
                                    },
                                    {
                                        "key": "contentType",
                                        "value": "attraction"
                                    },
                                    {
                                        "key": "webVariant",
                                        "value": "AttractionsFusion"
                                    },
                                    {
                                        "key": "pagee",
                                        "value": `${(page-1) * 30}`
                                    },
                                    {
                                        "key": "sort",
                                        "value": "undefined"
                                    }
                                ],
                                "toPath": "/Attractions-g187460-Activities-c42-Ibiza_Balearic_Islands.html",
                                "toRoute": "{\"page\":\"AttractionsFusion\",\"params\":{\"geoId\":187460,\"filters\":[{\"id\":\"category\",\"value\":[\"42\"]}],\"contentType\":\"attraction\",\"webVariant\":\"AttractionsFusion\",\"pagee\":\"30\"},\"path\":\"/Attractions-g187460-Activities-c42-Ibiza_Balearic_Islands.html\",\"fragment\":\"\"}",
                                "uid": "82944996-a37b-484e-b48b-e53c2d0b2c41",
                                "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
                            }
                        ]
                    }
                },
                "extensions": {
                    "preRegisteredQueryId": "8f5c28f35caeff98"
                }
            },
            {
                "variables": {
                    "events": [
                        {
                            "schemaName": "user_navigated",
                            "eventJson": "{\"producer_ref\":\"ta-web-domain\",\"uid\":\"82944996-a37b-484e-b48b-e53c2d0b2c41\",\"identifiers\":{},\"navigation_type\":\"USER_INITIATED\",\"user_agent\":\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36\",\"origin\":\"https://www.tripadvisor.com\",\"referrer\":\"https://www.tripadvisor.com/Attractions-g187460-Activities-c42-Ibiza_Balearic_Islands.html\",\"from_route\":{\"page\":\"AttractionsFusion\",\"params\":{\"geoId\":187460,\"filters\":[{\"value\":[\"42\"],\"id\":\"category\"}],\"contentType\":\"attraction\",\"webVariant\":\"AttractionsFusion\"},\"path\":\"/Attractions-g187460-Activities-c42-Ibiza_Balearic_Islands.html\",\"fragment\":\"\"},\"to_route\":{\"page\":\"AttractionsFusion\",\"params\":{\"geoId\":187460,\"filters\":[{\"id\":\"category\",\"value\":[\"42\"]}],\"contentType\":\"attraction\",\"webVariant\":\"AttractionsFusion\",\"pagee\":\"30\"},\"path\":\"/Attractions-g187460-Activities-c42-Ibiza_Balearic_Islands.html\",\"fragment\":\"\"},\"client_timestamp\":\"2024-07-07T07:12:44.632Z\"}"
                        }
                    ]
                },
                "extensions": {
                    "preRegisteredQueryId": "636d0b9184b2fc29"
                }
            },
            {
                "variables": {
                    "pageName": "AttractionsFusion",
                    "relativeUrl": "/Attractions-g187460-Activities-c42-Ibiza_Balearic_Islands.html",
                    "parameters": [
                        {
                            "key": "geoId",
                            "value": `${locationId}`
                        },
                        {
                            "key": "filters",
                            "value": "[object Object]"
                        },
                        {
                            "key": "contentType",
                            "value": "attraction"
                        },
                        {
                            "key": "webVariant",
                            "value": "AttractionsFusion"
                        },
                        {
                            "key": "pagee",
                            "value": `${(page-1) * 30}`
                        },
                        {
                            "key": "sort",
                            "value": "undefined"
                        }
                    ],
                    "route": {
                        "page": "AttractionsFusion",
                        "params": {
                            "geoId": locationId,
                            "filters": [
                                {
                                    "id": "category",
                                    "value": [
                                        "42"
                                    ]
                                }
                            ],
                            "contentType": "attraction",
                            "webVariant": "AttractionsFusion",
                            "pagee": `${(page-1) * 30}`
                        }
                    },
                    "routingLinkBuilding": false
                },
                "extensions": {
                    "preRegisteredQueryId": "211573a2b002568c"
                }
            },
            {
                "variables": {
                    "page": "AttractionsFusion",
                    "pos": "en-US",
                    "parameters": [
                        {
                            "key": "geoId",
                            "value": `${locationId}`
                        },
                        {
                            "key": "filters",
                            "value": "[object Object]"
                        },
                        {
                            "key": "contentType",
                            "value": "attraction"
                        },
                        {
                            "key": "webVariant",
                            "value": "AttractionsFusion"
                        },
                        {
                            "key": "pagee",
                            "value": `${(page-1) * 30}`
                        },
                        {
                            "key": "sort",
                            "value": "undefined"
                        }
                    ],
                    "factors": [
                        "TITLE",
                        "META_DESCRIPTION",
                        "MASTHEAD_H1",
                        "MAIN_H1",
                        "IS_INDEXABLE",
                        "RELCANONICAL"
                    ],
                    "route": {
                        "page": "AttractionsFusion",
                        "params": {
                            "geoId": locationId,
                            "filters": [
                                {
                                    "id": "category",
                                    "value": [
                                        "42"
                                    ]
                                }
                            ],
                            "contentType": "attraction",
                            "webVariant": "AttractionsFusion",
                            "pagee": `${(page-1) * 30}`
                        }
                    },
                    "currencyCode": this.currency
                },
                "extensions": {
                    "preRegisteredQueryId": "18d4572907af4ea5"
                }
            },
            {
                "variables": {
                    "uid": "LIT@k@gyYIBxq01@2yd88q9N",
                    "sessionId": "5CAEF6A025BB75DD235970B4BC29C375",
                    "currency": this.currency,
                    "sessionType": "DESKTOP",
                    "locationId": locationId,
                    "page": "AttractionsFusion"
                },
                "extensions": {
                    "preRegisteredQueryId": "fa5da6ee0b1deed3"
                }
            },
            {
                "variables": {
                    "locationId": locationId,
                    "uid": "LIT@k@gyYIBxq01@2yd88q9N",
                    "sessionId": "5CAEF6A025BB75DD235970B4BC29C375",
                    "currency": this.currency
                },
                "extensions": {
                    "preRegisteredQueryId": "42bec0ee6ec0bfd1"
                }
            },
            {
                "variables": {
                    "page": "AttractionsFusion",
                    "params": [
                        {
                            "key": "geoId",
                            "value": `${locationId}`
                        },
                        {
                            "key": "filters",
                            "value": "[object Object]"
                        },
                        {
                            "key": "contentType",
                            "value": "attraction"
                        },
                        {
                            "key": "webVariant",
                            "value": "AttractionsFusion"
                        },
                        {
                            "key": "pagee",
                            "value": `${(page-1) * 30}`
                        },
                        {
                            "key": "sort",
                            "value": "undefined"
                        }
                    ],
                    "route": {
                        "page": "AttractionsFusion",
                        "params": {
                            "geoId": locationId,
                            "filters": [
                                {
                                    "id": "category",
                                    "value": [
                                        "42"
                                    ]
                                }
                            ],
                            "contentType": "attraction",
                            "webVariant": "AttractionsFusion",
                            "pagee": `${(page-1) * 30}`
                        }
                    }
                },
                "extensions": {
                    "preRegisteredQueryId": "f742095592a84542"
                }
            },
            {
                "variables": {
                    "params": {
                        "geoId": locationId,
                        "filters": [
                            {
                                "id": "category",
                                "value": [
                                    "42"
                                ]
                            }
                        ],
                        "contentType": "attraction",
                        "webVariant": "AttractionsFusion",
                        "pagee": `${(page-1) * 30}`
                    },
                    "page": "AttractionsFusion",
                    "fragment": ""
                },
                "extensions": {
                    "preRegisteredQueryId": "a26bffd43d0e25b6"
                }
            },
            {
                "variables": {
                    "request": [
                        {
                            "locationIds": [
                                187460,
                                187459
                            ],
                            "pageContentId": null,
                            "pageType": null,
                            "timestamp": "1720336364641"
                        }
                    ]
                },
                "extensions": {
                    "preRegisteredQueryId": "f6368397e59fe429"
                }
            },
            {
                "variables": {
                    "request": {
                        "tracking": {
                            "screenName": "AttractionsFusion",
                            "pageviewUid": "LIT@k@gyYIBxq01@2yd88q9N"
                        },
                        "routeParameters": {
                            "geoId": locationId,
                            "filters": [
                                {
                                    "id": "category",
                                    "value": [
                                        "42"
                                    ]
                                }
                            ],
                            "contentType": "attraction",
                            "webVariant": "AttractionsFusion",
                            "pagee": `${(page-1) * 30}`
                        },
                        "updateToken": null
                    },
                    "commerce": {
                        "attractionCommerce": {
                            "pax": [
                                {
                                    "ageBand": "ADULT",
                                    "count": 2
                                }
                            ]
                        }
                    },
                    "tracking": {
                        "screenName": "AttractionsFusion",
                        "pageviewUid": "LIT@k@gyYIBxq01@2yd88q9N"
                    },
                    "sessionId": "5CAEF6A025BB75DD235970B4BC29C375",
                    "unitLength": "MILES",
                    "currency": this.currency,
                    "currentGeoPoint": null,
                    "mapSurface": false,
                    "debug": false,
                    "polling": false
                },
                "extensions": {
                    "preRegisteredQueryId": "be424059b81703a7"
                }
            }
        ]);

        // const response = await axios.post('https://www.tripadvisor.com/data/graphql/ids', data, config); <- english
        const response = await axios.post(`${this.baseUrl}/data/graphql/ids`, data, config); // hebrew

        // Extracting the data from the response
        const results = (response.data.map((o) => o.data?.["Result"]?.[0]?.["sections"].filter((i) => i["sectionId"] === "POI_LIST_CARD")).filter(Boolean)).flat().map((i) => this.format(destination, i))

        // keep on db
        await this.poiService.upsertAll(results, user);

        return {
            results,
            nextPage: results.length == 0 ? undefined : page + 1,
            isFinished: results.length == 0,
            source: this.source
        };
    }
}
