import {BadRequestException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import axios from "axios";
import {CreateTripDto} from "./dto/create-trip-dto";
import {User} from "../user/user.entity";
import {convertTime} from "../poi/utils/utils";
import {sleep} from "../shared/utils";
import {TripService} from "../trip/trip.service";
import {UserService} from "../user/user.service";
import {Request} from "express";

// todo complete:
// parameterize - currency, language
// keep to PointOfInterests
// keep to TripTemplates

const DEFAULT_NUM_OF_DAYS = 7;
const DEFAULT_EVENT_DURATION = "01:00";

function getClasses(...classes: any[]): string {
    return classes.filter(Boolean).join(' ');
}

interface Category{
    id: number;
    icon: string;
    title: string;
    description?: string;
}

export enum TriplanPriority {
    must = 1, // pink
    high = 10, // purple?
    maybe = 2, // orange (used to be purple in google maps)
    least = 3, // black
    unset = 0, // gray
}

export enum TriplanEventPreferredTime {
    morning = 1,
    noon = 2,
    afternoon = 3,
    sunset = 4,
    evening = 5,
    nevermind = 6,
    night = 7,
    unset = 0,
}

const categoryTranslations = {
    'he': {
        "CATEGORY.GENERAL": "כללי",
        "CATEGORY.HOTELS": "בתי מלון",
        "CATEGORY.FLIGHTS": "טיסות",
        "CATEGORY.FOOD": "אוכל",
        "CATEGORY.DESSERTS": "קינוחים",
        "CATEGORY.BARS_AND_NIGHTLIFE": "ברים וחיי לילה",
        "CATEGORY.SHOPPING": "קניות",
        "CATEGORY.ATTRACTIONS": "אטרקציות",
        "CATEGORY.GIMMICKS": "גימיקים",
        "CATEGORY.NATURE": "טבע",
        "CATEGORY.TOURISM": "תיירות",
        "CATEGORY.VIEWS": "תצפיות",
        "CATEGORY.PARKS": "פארקים",
        "CATEGORY.CITIES": "עיירות",
        "CATEGORY.BEACHES": "חופים",
        "CATEGORY.BEACH_BARS": "ביץ׳ ברים",
        "CATEGORY.MUSEUMS": "מוזיאונים"
    },
    en: {
        "CATEGORY.GENERAL": "General",
        "CATEGORY.HOTELS": "Hotels",
        "CATEGORY.FLIGHTS": "Flights",
        "CATEGORY.FOOD": "Food",
        "CATEGORY.DESSERTS": "Desserts",
        "CATEGORY.BARS_AND_NIGHTLIFE": "Bars and Nightlife",
        "CATEGORY.SHOPPING": "Shopping",
        "CATEGORY.ATTRACTIONS":"Attractions",
        "CATEGORY.GIMMICKS": "Gimmicks",
        "CATEGORY.NATURE": "Nature",
        "CATEGORY.TOURISM": "Tourism",
        "CATEGORY.VIEWS": "Views",
        "CATEGORY.PARKS": "Parks",
        "CATEGORY.CITIES": "Cities",
        "CATEGORY.BEACHES": "Beaches",
        "CATEGORY.BEACH_BARS": "Beach bars",
        "CATEGORY.MUSEUMS": "Museums"
    }
}

const getDefaultCategories = (): Category[] => {
    return [
        {
            id: 1,
            icon: '🧞‍♂️',
            title: "CATEGORY.GENERAL",
            description: 'CATEGORY.GENERAL.DESCRIPTION',
        },
        {
            id: 2,
            icon: '🛫',
            title: "CATEGORY.FLIGHTS",
            description: 'CATEGORY.FLIGHTS.DESCRIPTION',
        },
        {
            id: 3,
            icon: '🏩',
            title: "CATEGORY.HOTELS",
            description: 'CATEGORY.HOTELS.DESCRIPTION',
        },
        {
            id: 4,
            icon: '🍕',
            title: "CATEGORY.FOOD",
            description: 'CATEGORY.FOOD.DESCRIPTION',
        },
        {
            id: 5,
            icon: '🍦',
            title: "CATEGORY.DESSERTS",
            description: 'CATEGORY.DESSERTS.DESCRIPTION',
        },
        {
            id: 6,
            icon: '🍹',
            title: "CATEGORY.BARS_AND_NIGHTLIFE",
            description: 'CATEGORY.BARS_AND_NIGHTLIFE.DESCRIPTION',
        },
        {
            id: 7,
            icon: '🛒',
            title: "CATEGORY.SHOPPING",
            description: 'CATEGORY.SHOPPING.DESCRIPTION',
        },
        {
            id: 8,
            icon: '⭐',
            title: "CATEGORY.ATTRACTIONS",
            description: 'CATEGORY.ATTRACTIONS.DESCRIPTION',
        },
        {
            id: 9,
            icon: '👻',
            title: "CATEGORY.GIMMICKS",
            description: 'CATEGORY.GIMMICKS.DESCRIPTION',
        },
        {
            id: 10,
            icon: '🌺',
            title: "CATEGORY.NATURE",
            description: 'CATEGORY.NATURE.DESCRIPTION',
        },
        {
            id: 11,
            icon: '🗽',
            title: "CATEGORY.TOURISM",
            description: 'CATEGORY.TOURISM.DESCRIPTION',
        },
    ];
};

function getNonDefaultCategories(numOfCategories: number, title: string): Category{
    function getIcon(title: string) {
        switch (title){
            case 'CATEGORY.VIEWS':
                return '🌇';
            case 'CATEGORY.PARKS':
                return '🏞️';
            case 'CATEGORY.CITIES':
                return '🏘️';
            case 'CATEGORY.BEACHES':
                return '🏖️';
            case 'CATEGORY.BEACH_BARS':
                return '🍻';
            case 'CATEGORY.CLUBS':
                return '💃';
            // case 'CATEGORY.MUSEUMS':
            //     return '🏛️';
            default:
                return '';
        }
    }

    return {
        id: numOfCategories + 1,
        icon: getIcon(title),
        title
    }
}

const destinationTranslations = {
    'he': {
        "Budapest": "בודפשט",
        "Switzerland": "שוויץ",
        "London": "לונדון",
        "Dubai": "דובאי",
        "Israel": "ישראל",
        "Italy": "איטליה",
        "Maldives": "האיים המלדיבים",
        "Seychelles": "איי סיישל",
        "Paris": "פריז",
        "Mexico": "מקסיקו",
        "Mexico City": "מקסיקו סיטי",
        "Greece": "יוון",
        "Bali": "באלי",
        "Costa Rica": "קוסטה ריקה",
        "Lima": "לימה",
        "Brazil": "ברזיל",
        "Panama": "פנמה",
        "Portugal": "פורטוגל",
        "Turkey": "טורקיה",
        "Hawaii": "הוואי",
        "Philippines": "פיליפינים",
        "Indonesia": "אינדונזיה",
        "Rio de Janeiro": "ריו דה ז׳נרו",
        "Milan": "מילאנו",
        "Barcelona": "ברצלונה",
        "Istanbul": "איסטנבול",
        "Lisbon": "ליסבון",
        "Japan": "יפן",
        "China": "סין",
        "Tel Aviv": "תל אביב",
        "Morocco": "מרוקו",
        "Spain": "ספרד",
        "Bahamas": "איי בהאמה",
        "Mykonos": "מיקונוס",
        "Fiji": "פיג׳י",
        "Colombia": "קולומביה",
        "Tanzania": "טנזניה",
        "Rome": "רומא",
        "Netherlands": "הולנד",
        "Amsterdam": "אמסטרדם",
        "South Africa": "דרום אפריקה",
        "Croatia": "קרואטיה",
        "Mauritius": "מאוריציוס",
        "Peru": "פרו",
        "Singapore": "סינגפור",
        "Abu Dhabi": "אבו דאבי",
        "Austria": "אוסטריה",
        "Vienna": "וינה",
        "Chile": "צ׳ילה",
        "France": "צרפת",
        "Germany": "גרמניה",
        "Berlin": "ברלין",
        "Zurich": "ציריך",
        "Tehran": "טהרן",
        "Haifa": "חיפה",
        "Norway": "נורווגיה",
        "Jordan": "ירדן",
        "Munich": "מינכן",
        "Malta": "מלטה",
        "Bucharest": "בוקרשט",
        "Lagos": "לאגוס",
        "Finland": "פינלנד",
        "Romania": "רומניה",
        "Prague": "פראג",
        "Athens": "אתונה",
        "Bangkok": "בנקוק",
        "Florida": "פלורידה",
        "Koh Tao": "קו טאו",
        "Koh Samui": "קוסמוי",
        "Phuket": "פוקט",
    }
}

@Injectable()
export class TripadvisorAIService {

    private source = "TripAdvisor"
    private language = "he"; // en-US
    private logger = new Logger("AIService");

    private debugMode = false; // todo: change to false

    constructor(
        private userService: UserService,
        private tripService: TripService,
        // private poiService: PointOfInterestService
    ) {
    }

    async getLocationId(destination: string) {

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
                'origin': 'https://www.tripadvisor.com',
                'priority': 'u=1, i',
                'referer': 'https://www.tripadvisor.com',
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

        const response = await axios.post('https://www.tripadvisor.com/data/graphql/ids', data, config);
        return response.data[0].data["Typeahead_autocomplete"]?.["results"].find((r) => r["locationId"])?.["locationId"];
    }

    async _createTrip(params: CreateTripDto, locationId: number) {
        const data = JSON.stringify([
            {
                "variables": {
                    "request": {
                        "locationIds": [
                            locationId
                        ],
                        "includesLocationIds": [], // nice! todo complete: use it
                        "interestTagIds": params.interests ?? [
                            "Must-see Attractions",
                            "Great Food",
                            "Hidden Gems",
                            "Beach Clubs",
                            "Nightlife & Clubs"
                        ],
                        "interestTags": params.interests ?? [
                            "Must-see Attractions",
                            "Great Food",
                            "Hidden Gems",
                            "Beach Clubs",
                            "Nightlife & Clubs"
                        ],
                        "additionalInterests": "Desserts, Luxury, Shopping, Hotel",
                        "travelingWith": params.travelingWith ?? "SPOUSE",
                        // @ts-ignore
                        "includeChildren": params.includeChildren ? params.includeChildren == "true" : false,
                        // @ts-ignore
                        "includePets": params.includePets ? params.includePets == "true" : false,
                        "tripDate": {
                            "approximateDate": {
                                "numberOfDays": params.numberOfDays ?? DEFAULT_NUM_OF_DAYS
                            }
                        },
                        "useQueueProcessing": true,
                        "trackingToken": "3a7ea5e2-3d30-478c-a0cc-49def3906d85",
                        "experimentationAttributes": {
                            "page": "Trips",
                            "deviceType": "DESKTOP"
                        },
                        "prefetchInterestTagsRequest": {
                            "locationId": locationId
                        }
                    }
                },
                "extensions": {
                    "preRegisteredQueryId": "cee736ea95426067"
                }
            },
            {
                "variables": {
                    "request": {
                        "clientRequestTimestampMs": 1720352683987,
                        "request": [
                            {
                                "pageUid": "e940ce0f-354b-4b5b-862b-4e208c9f0be3",
                                "userId": "CACC3E8153BD94E1CD3B50C018FBD8BA",
                                "sessionId": "480C31B8757865F5A4EA6F3386F554AE",
                                "page": "AITripBuilder",
                                "userAgent": "DESKTOP",
                                "eventTimestampMs": 1720352683987,
                                "team": "Trips",
                                "customData": "{\"newsletterId\":null,\"mcid\":null,\"utmCampaign\":null,\"utmMedium\":null,\"utmSource\":null,\"flowID\":\"3a7ea5e2-3d30-478c-a0cc-49def3906d85\"}",
                                "itemName": "TripLoadingItinerary",
                                "itemType": "GenerateTrip"
                            }
                        ]
                    }
                },
                "extensions": {
                    "preRegisteredQueryId": "b682df01eec3e82a"
                }
            }
        ]);

        const config = {
            headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9,he;q=0.8',
                'content-type': 'application/json',
                'cookie': '_lc2_fpi=b140173de591--01gt429gejrkxt413pqa652v0a; _ga=GA1.1.638195325.1689358016; TASameSite=1; TAUnique=%1%enc%3A0bPt1DAbYLIqESpYS80bugE8%2B5kuzt268t5VIrI2MPcjSQ4AgGj8MYa8cLRVZTbhNox8JbUSTxk%3D; TASSK=enc%3AAL9%2FMo7e0LFaHvbB4kNE6KtR7Ii3NAFypprnC7ot6mhaZn9rdNcrDztNHuC3QAdjtblZSysSh4o5%2BmxIqMBt8jjSWRiYaIyD78WQKEe2OT%2BW99oEwcmfzaQiOOwv57BBsA%3D%3D; VRMCID=%1%V1*id.10568*llp.%2FSmartDeals-g295424-Dubai_Emirate_of_Dubai-Hotel-Deals%5C.html*e.1718974228161; TATrkConsent=eyJvdXQiOiJTT0NJQUxfTUVESUEiLCJpbiI6IkFEVixBTkEsRlVOQ1RJT05BTCJ9; _gcl_au=1.1.1974327381.1718369431; pbjs_sharedId=653f5e58-fe42-49cb-a99a-9a5da5a0cc87; pbjs_sharedId_cst=zix7LPQsHA%3D%3D; _lc2_fpi_meta=%7B%22w%22%3A1718369435081%7D; _lr_env_src_ats=false; pbjs_unifiedID=%7B%22TDID%22%3A%225c2f933c-fe19-45d0-9e85-0f04151db2c3%22%2C%22TDID_LOOKUP%22%3A%22TRUE%22%2C%22TDID_CREATED_AT%22%3A%222024-05-14T12%3A50%3A42%22%7D; pbjs_unifiedID_cst=zix7LPQsHA%3D%3D; TART=%1%enc%3AacB1OBrvcdiX91CQe8UUWjZtUu8yeRrwKH8dpdaX369zUgJZMudUDpl88bVjzUV6MiviWETFWp4%3D; _li_dcdm_c=.tripadvisor.com; ServerPool=C; TATravelInfo=V2*A.2*MG.-1*HP.2*FL.3*RS.1; TADCID=ZFVhNjQZz3T_4VKtABQCmq6heh9ZSU2yA8SXn9Wv5H66vIwuI_WELKmDFgkE7BTB6AcQY-1VTQ1nPSPfYOdP0IABpeyOuKbjvFc; PMC=V2*MS.72*MD.20240614*LD.20240707; _lr_sampling_rate=100; pbjs_li_nonid=%7B%7D; pbjs_li_nonid_cst=zix7LPQsHA%3D%3D; TASID=480C31B8757865F5A4EA6F3386F554AE; _abck=CFCC95316C817ECEC69FF1FC649B009D~-1~YAAQNyhDF6I1YWyQAQAAsUX9jAwEgjiMViNAU++ud6WIsK0QhqFpa3s73CaBUfa2pb9y8cCwl7egx3qWV/RIMnuxS1BK2l5LreXrLj+Ic/noXsFEPFJn/8NMTQm8EHnAaeWDeZeXSooTb6OdWZqdgo6vEFjJcmHWLAl7cEiPWuTJ7j4fsVw2tRDr3DO+SPSYjUrjmWm5QICRBf799DH/FyTKU6BwdULjLcmzsUKgafePYO8rOOxAxFAik/8+IOKuL8mmueGf9mJt5tcvAGF9i+mz8PSZ8/xWeWUedK3OI5QL9j46UjKoIUfLuzoRw9MAzgp2L2XhLHyj//NG+emTUu6MIi9DVlrhmoxeTXyTuH4LCCVKBU7LSwH1D2NtDRfhbdIjBg==~-1~-1~-1; PAC=AMkQ1HRdOZUoNqZ5yECKEQg31a4v5B5N-xFKdBqv10rC41WEGaAf1rq6TRLVP8ATvDzJP0NAJ0LBbdUudDlAC0d0hZHZ5vdixC8DyUfXIqzKXH_C3QLpo1Vp13mlflRkJQtkuym6WAqPPZTrldjW76hrS8OKGvw7iWbBXtZMUbwMCCec8yggMo7F5LBDoyMzb_EyzDLbd0Ie05COaE6jh_uueQq7CheWc6xZpDKs3smxLb-K152F_ay33N_eQyPXBc5W2slFuqeY9pTpp1Gv5yo%3D; __gads=ID=66a69a46b8e21b64:T=1718369436:RT=1720352329:S=ALNI_MZjmygAUKC3s81bj9XdFj5F8wfjCA; __gpi=UID=00000e3a96c5fbe2:T=1718369436:RT=1720352329:S=ALNI_MYw9d2pn0a3N4lRHQ7_Z-whAwkLXg; __eoi=ID=89724796ff128a3b:T=1718369436:RT=1720352329:S=AA-AfjY8p-1xJWCJNvn3cTJxAJ4T; _lr_retry_request=true; ab.storage.deviceId.6e55efa5-e689-47c3-a55b-e6d7515a6c5d=%7B%22g%22%3A%225e259853-1479-e243-c1ef-2917192fcb99%22%2C%22c%22%3A1718369430721%2C%22l%22%3A1720352524279%7D; ab.storage.sessionId.6e55efa5-e689-47c3-a55b-e6d7515a6c5d=%7B%22g%22%3A%22b14957d9-273c-ce5f-cdf0-f6b74e76c749%22%2C%22e%22%3A1720352539286%2C%22c%22%3A1720352524278%2C%22l%22%3A1720352524286%7D; G_AUTH2_MIGRATION=informational; TAAUTHEAT=5bAR7bH7bdgFByxZABQCNrrFLZA9QSOijcELs1dvVz6S7MHyvadU9A5Q4kfiNiWxg90WaoxdxBQduCPnOUd8qjRbEiVniAwFehqqsjfwMJd6euxLlGruWT8ChsI7KOKDy7FPFU7trLIiRAovHiU1c3-7bc5JqilHgI7FRmmNGbVkcg0ZhN-tYW4gX3Pnb-Goa3ysxBNemZUwodKOu_zW6YqJRNJDhuYi3yxV; __vt=12pZ5BTH3ETkt7NcABQCwRB1grfcRZKTnW7buAoPsS6ZjIYZS5_-9_WO9QlQ0seJ94hc3m-ChrpIFaahQ2dUvbwNEB4cmgIVjSo2h_RjB_IYTem1FDU_54FFW_q7Yq4a3t44LBB7dDxDDdfFMIaUBXUUCKXxQ0Z4_IjqKavFKFeFM3GjZNmjLN8kHZQ_grfXY50wrMsC4zTct_7rpQgUY1wEE0B2iLTbIiIrcgEagns9hJrlw2USaxOte4MS_WqWh_sEwy7_N4L-9JwQVvzCY41Gncmz7hKRz_U6VYoP4XeUEgpJ2VcDjKDjEg7B9AidlDZ93uo--pC29yYE3Phii9SpO4aqdnHRmXCw1WC57ffLmKnLTTxJZY0l5aC9V66HxHGRzwX-m98bCqlM_4jeVwajoKAl8A; AMZN-Token=v2FweIBrWnJxVWtibEdaSVdHMDlQTlNJNy9VQzlmSG55SEx3NkhZM2toY1hSeWpwVEpoZG9GWmo3KzdHazBxcHFGb3p2Mlc5OU9DYzdETFhpNU5aVDhyak9pM1l4RXh2cXlkVmZ5TFhPRGlGK1hvZHIyZEFZR0dEOWM2QUdtMGlVN0wyOWJrdgFiaXZ4HDc3Kzk3Nys5T0djVkwyRjQ3Nys5Wm5idnY3MD3/; TAUD=LA-1720120391622-1*RDD-2-2024_07_04*ARC-2727761*LG-232251956-2.1.F.*LD-232251957-.....; OptanonConsent=isGpcEnabled=0&datestamp=Sun+Jul+07+2024+14%3A44%3A04+GMT%2B0300+(Israel+Daylight+Time)&version=202310.2.0&isIABGlobal=false&hosts=&consentId=CACC3E8153BD94E1CD3B50C018FBD8BA&interactionCount=2&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1&AwaitingReconsent=false&browserGpcFlag=0; _gcl_aw=GCL.1720352644.null; TASession=%1%V2ID.480C31B8757865F5A4EA6F3386F554AE*SQ.46*PR.40612%7C*LS.AITripBuilder*HS.recommended*ES.popularity*DS.5*SAS.popularity*FPS.oldFirst*TS.CACC3E8153BD94E1CD3B50C018FBD8BA*FA.1*DF.0*TRA.true*LD.19175168*EAU.C; _ga_QX0Q50ZC9P=GS1.1.1720352327.7.1.1720352644.60.0.0; datadome=L8ThYowiKxMqiernvf4vlCKZxLalqLhTUUQd44l7YJe~gR_ymuO2AxVWWc7meeKvby2DC7OGX778J2j8K5Dc6ptBI~33aqw5mq2HXXNmwqk_60cLOyc73qq31TEQLqLI; TAUnique=%1%enc%3AD%2Fch1%2BQ2hpeH0%2F%2BuCFHlKaolf3ScFFQaXQs0JsPcVadR7t%2FphnBsBy96c2%2FgF6t%2BNox8JbUSTxk%3D; _abck=CFCC95316C817ECEC69FF1FC649B009D~-1~YAAQnYdkX4uFwoiQAQAAnT8XjQwBLqxDq4Ai1z7w+gm5G3e6UDZk4LG3CtOedG+YaTvGdfjSAV6DKjFQIGVWZsx1bEQ5ZkwXxTCaFNxnXI9dF9AXeBt73yMaxdpodaQ+FsQIK4vqbJ2fgBrdYys7nclckPCKrRj1wUfcHMoLALqYLGM1f8NEczfpgxmUeKvCF/lRg7MICv8WjVLCrZok2u/j6xbR/mqOGNpMKmaxfnRA9nCHHtfjMmrJ6qlxT5XAFaH+Htd42adl9ip86kqzFbquCQpyidqCHgL0m0EYOEDV8/t2ETi6DSJmYwK5YT605vI+nh8eAeTQIbQzdo5Xwj5qdrBRR6MKjlV/VLGzHsZ+VloBlyAeD9j3JoTlQNJ8aLRDrw==~-1~-1~-1; bm_sz=4B7C96615BF9238016B2454CF79374F8~YAAQnYdkXxKBwoiQAQAAvg0XjRgEEyd83VRTpKB3oTDd+pPFncIsoal3givI6i+DyO8d7B02ssa+8yqhIYInKiYcDt2ZPjtJs/Hm9AcwF1r7vPXWZDleSS3Z2PmJZZMlvnaqMb/Bbesy/eKZ2RzJwvC5lER8UzibqVY1KfLlLNfB02+8kX5rx0UMBrB+83iW41BTB3xIJWP1CcMQid3+z3/aQr3w9EmdfizBxH1kGt48yxcNX0CPsZujKUfoDvUd2ZHBTXmF4OChj1RiTTWOpl2tMH86YM2WKx59IDMKslO30bBcKeOHNatOWxQAjXNFzbVFzHTtSZqCK9wGHgRFFGHQYwDtK80hHPnlKflMCNv3aZY=~3425591~3359794; __vt=AiaoCE_JRGFy66d2ABQCwRB1grfcRZKTnW7buAoPsS6ZpBi16hkS4x3OiO1OB0XLga_HvlfVeOAyZXVdCg68tlOLRcdRRXB7gtbbAJ7MkCWPiQmYwz7T4DKpq585HZDTyVfErA-19Fquvdta4uS0tEHqzg',
                'origin': 'https://www.tripadvisor.com',
                'priority': 'u=1, i',
                'referer': 'https://www.tripadvisor.com/AITripBuilder',
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
            }
        };

        const response = await axios.post('https://www.tripadvisor.com/data/graphql/ids', data, config)
        return response.data?.[0]?.["data"]?.["Trips_createGeneratedTrip"]?.["tripId"];
    }

    extractCategory(arr) {
        const categoryToKeywordMapping = {
            "CATEGORY.DESSERTS": [
              "desserts",
              "cake",
              "cookies",
              "Macaroon",
              "Waffle"
            ],
            "CATEGORY.ATTRACTIONS": [
                "Studio Tour",
                "hiking",
                "hikes",
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
                // "Adventure",
                "Desert Safari",
                "Dubai Snow",
                "Ferrari World",
                "Superyacht",
                "jet ski",
                // "Adventure",
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
                "captivating attraction",
                // "attraction"
            ],
            "CATEGORY.SHOPPING": ["Shopping", "mall"," store", "outlet"],
            "CATEGORY.NATURE": [
                "picnic",
                "flowers garden",
                "forest",
                "mountains"
            ],
            "CATEGORY.TOURISM": ["city-walk", "מסגד", "טיילת", "המרינה", "אייפל", "eifel", "souk", "שווקים", "Historical Tours", "museum", "cultural exploration", "Historical Neighbourhood"],
            "CATEGORY.VIEWS": ["sky view", "תצפית", "dubai frame", "breathtaking views"],
            "CATEGORY.BARS_AND_NIGHTLIFE": ["dance club", "lounge", "club", " disco "],
            "CATEGORY.PARKS": ["פארק"],
            "CATEGORY.CITIES": ["עיירה", "עיירות"],
            "CATEGORY.BEACHES": ["beach "],
            "CATEGORY.BEACH_BARS": ["beach bar"],
            // "CATEGORY.MUSEUMS": ["Museum"],
            "CATEGORY.HOTELS": [
                "six senses",
                "sixsenses",
                "hotel",
                "resort",
                "בית מלון",
                "המלון",
            ],
            "CATEGORY.FOOD": ["restaurant", "cafe", "מסעדה", "chocolate", "croissants", "food", "drink", "Restaurant"],
            "CATEGORY.GIMMICKS": ["glow in the dark", "glow in dark", "secret bar", "fairy tales", "magical experience"]
        };
        let toReturn = "CATEGORY.GENERAL";

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

    format(item: Record<string, any>, params){
        const details = item["object"];
        const description = details?.["narrativeDescription"]?.["plainText"];

        const innerDetails = details?.["object"]?.["object"];
        const title = innerDetails?.["name"];

        const location = {
            address: innerDetails?.["localizedStreetAddress"]?.["fullAddress"] ?? innerDetails?.["localizedStreetAddress"]?.["street1"] ?? innerDetails["name"],
            latitude: innerDetails?.["latitude"],
            longitude: innerDetails?.["longitude"],
            eventName: innerDetails["name"],
            locationId: innerDetails?.["locationId"],
            countryId: innerDetails?.["countryId"]
        };
        const placeType = innerDetails?.["placeType"];
        const category = this.extractCategory([
            title,
            description?.replace("coffee shops", "").replace("Dubai Mall", "").replace("close to the Radisson Blue hotel", "").replace("food outlets", "food") ?? "",
            placeType
        ]);

        // const ratingVal = item?.["communityContent"]?.find((i) => i.includes("rank"))?.["rank"];
        // const ratingQuantity = item?.["communityContent"]?.find((i) => i.includes("rank"))?.["total"];
        const ratingVal = innerDetails?.["reviewSummary"]?.["rating"];
        const ratingQuantity = innerDetails?.["reviewSummary"]?.["count"];
        const rating = {
            "rating": ratingVal ?? 0,
            "quantity": ratingQuantity ?? 0
        }

        const displayDuration = innerDetails?.["locationV2"]?.["details"]?.["productDetails"]?.["displayDuration"] ?? {};
        let durationString;
        if (displayDuration["durationInMinutes"]){
            durationString = `${displayDuration["durationInMinutes"]} minutes`;
        } else if (displayDuration["from"] && displayDuration["to"] && displayDuration["timeUnit"]){
            durationString = `${displayDuration["from"]} - ${displayDuration["to"]} ${displayDuration["timeUnit"].toLowerCase()}`;
        }

        const duration = durationString ? convertTime(durationString) : DEFAULT_EVENT_DURATION;

        const hoursOfOperation = innerDetails?.["hoursOfOperation"]?.["dailyTimeIntervals"] ?? [];
        const openingHours = {}

        const formatTime = (time) => {
            // Pad hours and minutes to always be two digits
            const hours = String(time.hours).padStart(2, '0');
            const minutes = String(time.minutes).padStart(2, '0');
            return `${hours}:${minutes}`;
        };

        hoursOfOperation.forEach((interval) => {
            const day = interval.day;

            openingHours[day] = [];

            interval.timeIntervals.forEach((_interval) => {
                const { openingTime, closingTime } = _interval;
                openingHours[day].push({
                    start: formatTime(openingTime),
                    end: formatTime(closingTime)
                });
            })

        });

        let moreInfo = innerDetails?.["route"]?.["url"];
        if (moreInfo?.length) {
            moreInfo = `https://www.tripadvisor.com${moreInfo}`;
        }

        const tags = innerDetails?.["tags"]?.["tags"]?.map((tag) => tag?.["tag"]?.["localizedName"]);

        const rewards = innerDetails?.["locationV2"]?.["bestAwardForActiveYearV2"] ?? undefined;

        const priority = (
            (!!rewards || (rating.rating == 5 && Number(rating.quantity) > 1000))
        ) ? TriplanPriority.high : TriplanPriority.unset;

        function getPreferredTime(category): TriplanEventPreferredTime | undefined {
            if (category === "CATEGORY.BARS_AND_NIGHTLIFE") {
                return TriplanEventPreferredTime.night;
            } else if (category === "CATEGORY.DESSERTS") {
                return TriplanEventPreferredTime.morning;
            } else if (category === "CATEGORY.BEACH_BARS" || category === "CATEGORY.BEACHES") {
                return TriplanEventPreferredTime.noon;
            }
        }

        return {
            id: item["id"],
            title,
            duration,
            category,
            categoryId: category,
            description,
            priority,
            preferredTime: getPreferredTime(category),
            className: getClasses(priority && `priority-${priority}`),
            location,
            allDay: Number(duration.split(":")[0]) >= 8,
            openingHours: Object.keys(openingHours).length > 0 ? openingHours : undefined,
            images: innerDetails?.["photos"]?.map((photo) => {
                const arr = photo?.["photoSizes"] ?? [];
                if (arr.length) {
                    return arr[arr.length-1]?.["url"];
                }
                return null;
            }).filter(Boolean).join("\n"),
            moreInfo,
            price: innerDetails?.["recommendedProduct"]?.["pricingInfo"]?.["fromPrice"],
            currency: params.currency,
            extra: {
                rating,
                tags,
                rewards,
                currency: params.currency,
                category: category,
                categoryId: category,
            }
        }
    }

    getTripFromCache(){
        return {
            "__typename": "Trips_TripV2",
            "id": 135076545,
            "generatedTripRequest": {
                "includeChildren": false,
                "includePets": false,
                "locationIds": [
                    295424
                ],
                "travelingWith": "SPOUSE",
                "tripDate": {
                    "exactDate": null,
                    "approximateDate": {
                        "month": null,
                        "numberOfDays": 4
                    }
                }
            },
            "title": "Your trip to Dubai for 4 days with your partner",
            "description": "Dubai offers a unique blend of modern architecture, luxurious shopping, and traditional markets. You can explore iconic landmarks, indulge in delicious cuisine from around the world, and uncover hidden gems in the bustling city. Whether you're admiring stunning skyscrapers, tasting local Emirati dishes, or wandering through vibrant souks, Dubai has something for every traveler. With your partner by your side, you can create unforgettable memories in this dynamic destination over the course of your 4-day trip.",
            "tripLocations": [
                {
                    "location": {
                        "locationId": 295424,
                        "latitude": 25.274548,
                        "longitude": 55.36086,
                        "name": "Dubai"
                    }
                }
            ],
            "structure": {
                "buckets": [
                    {
                        "id": 639178030,
                        "items": [
                            703224687,
                            703224688,
                            703224689,
                            703224690,
                            703224691
                        ],
                        "narrativeDescription": {
                            "text": "Welcome to Dubai, United Arab Emirates! Today is packed with exciting experiences that cater to your interests. Start your day at {{c877c90d-d58a-4604-9499-5ddf9d5ad035}}, a must-see attraction with endless shopping and entertainment options. Then, indulge in delicious world street food at {{94bd2c72-69e2-4712-b12c-478c33ab9de7}}. Don't miss the iconic {{2a4df978-4155-4699-83e3-0a3bdd4425e6}}, the tallest building in the world. Explore the rich history of Dubai at {{95192ccc-5509-4c66-802c-56f1a9557c94}}. End the day with a romantic dinner at {{6d462ecd-8b6d-446c-9e32-00492e3fba9e}}, a hidden gem known for its authentic cuisine. Enjoy your day exploring Dubai with your partner!",
                            "plainText": "Welcome to Dubai, United Arab Emirates! Today is packed with exciting experiences that cater to your interests. Start your day at The Dubai Mall, a must-see attraction with endless shopping and entertainment options. Then, indulge in delicious world street food at 24th St. World Street Food. Don't miss the iconic Burj Khalifa, the tallest building in the world. Explore the rich history of Dubai at Al Fahidi Historical Neighbourhood. End the day with a romantic dinner at Local House Restaurant, a hidden gem known for its authentic cuisine. Enjoy your day exploring Dubai with your partner!",
                            "references": [
                                {
                                    "itemId": 703224687,
                                    "name": "c877c90d-d58a-4604-9499-5ddf9d5ad035",
                                    "value": "The Dubai Mall"
                                },
                                {
                                    "itemId": 703224688,
                                    "name": "94bd2c72-69e2-4712-b12c-478c33ab9de7",
                                    "value": "24th St. World Street Food"
                                },
                                {
                                    "itemId": 703224689,
                                    "name": "2a4df978-4155-4699-83e3-0a3bdd4425e6",
                                    "value": "Burj Khalifa"
                                },
                                {
                                    "itemId": 703224690,
                                    "name": "95192ccc-5509-4c66-802c-56f1a9557c94",
                                    "value": "Al Fahidi Historical Neighbourhood"
                                },
                                {
                                    "itemId": 703224691,
                                    "name": "6d462ecd-8b6d-446c-9e32-00492e3fba9e",
                                    "value": "Local House Restaurant"
                                }
                            ]
                        }
                    },
                    {
                        "id": 639178031,
                        "items": [
                            703224732,
                            703224733,
                            703224734,
                            703224735,
                            703224736
                        ],
                        "narrativeDescription": {
                            "text": "Your second day in Dubai will start with a visit to the charming {{37aec42a-9f00-4383-8d62-8e183231df61}}, where you can explore the historic architecture and narrow alleyways. Afterward, head to {{2bcf96ea-1b40-43e9-acf9-1db82342da32}} for a delicious lunch of authentic Middle Eastern cuisine. In the afternoon, make your way to {{2024841a-ac1e-4b54-8302-c8cba57cdc6f}} to witness the stunning water show set to music. Then, take a relaxing boat ride on {{6a4ecb61-80f5-4490-8bd6-ec823dc06fbb}} to soak in the beautiful views of the city. Finally, end your day with a romantic dinner at {{efe2007d-21cc-425e-8087-57a97dc02f7d}}, a hidden gem known for its exquisite dining experience.",
                            "plainText": "Your second day in Dubai will start with a visit to the charming Bastakia Quarter, where you can explore the historic architecture and narrow alleyways. Afterward, head to Operation Falafel for a delicious lunch of authentic Middle Eastern cuisine. In the afternoon, make your way to The Dubai Fountain to witness the stunning water show set to music. Then, take a relaxing boat ride on Dubai Creek to soak in the beautiful views of the city. Finally, end your day with a romantic dinner at Secret Garden by VII, a hidden gem known for its exquisite dining experience.",
                            "references": [
                                {
                                    "itemId": 703224732,
                                    "name": "37aec42a-9f00-4383-8d62-8e183231df61",
                                    "value": "Bastakia Quarter"
                                },
                                {
                                    "itemId": 703224733,
                                    "name": "2bcf96ea-1b40-43e9-acf9-1db82342da32",
                                    "value": "Operation Falafel"
                                },
                                {
                                    "itemId": 703224734,
                                    "name": "2024841a-ac1e-4b54-8302-c8cba57cdc6f",
                                    "value": "The Dubai Fountain"
                                },
                                {
                                    "itemId": 703224735,
                                    "name": "6a4ecb61-80f5-4490-8bd6-ec823dc06fbb",
                                    "value": "Dubai Creek"
                                },
                                {
                                    "itemId": 703224736,
                                    "name": "efe2007d-21cc-425e-8087-57a97dc02f7d",
                                    "value": "Secret Garden by VII"
                                }
                            ]
                        }
                    },
                    {
                        "id": 639178032,
                        "items": [
                            703224899,
                            703224900,
                            703224901,
                            703224902,
                            703224903
                        ],
                        "narrativeDescription": {
                            "text": "On the third day of your trip to Dubai, start your morning with a delicious breakfast at {{c7b76cb3-bdcf-4b8c-a63e-b4618adb107e}}. Then, head to {{6a0acdf7-cbf2-42c3-bddc-d4d172522ba2}} to explore the art galleries and unique shops. For lunch, try the local flavors at {{223ad8a8-80fe-433a-9713-6df80703a513}}. In the afternoon, take a leisurely stroll around {{4c6ebda4-7066-4ed9-b27d-65243908c299}} and enjoy the stunning views. End your day at the beautiful {{4236cdee-7a2e-4bd7-95da-5a2cc6cd42e8}}, filled with colorful flowers and intricate designs. This day is a perfect mix of cultural experiences and relaxing moments with your partner.",
                            "plainText": "On the third day of your trip to Dubai, start your morning with a delicious breakfast at Jones The Grocer - Delta Jbr. Then, head to Alserkal Avenue to explore the art galleries and unique shops. For lunch, try the local flavors at Local - TRYP by Wyndham. In the afternoon, take a leisurely stroll around Dubai Marina and enjoy the stunning views. End your day at the beautiful Dubai Miracle Garden, filled with colorful flowers and intricate designs. This day is a perfect mix of cultural experiences and relaxing moments with your partner.",
                            "references": [
                                {
                                    "itemId": 703224899,
                                    "name": "223ad8a8-80fe-433a-9713-6df80703a513",
                                    "value": "Local - TRYP by Wyndham"
                                },
                                {
                                    "itemId": 703224900,
                                    "name": "6a0acdf7-cbf2-42c3-bddc-d4d172522ba2",
                                    "value": "Alserkal Avenue"
                                },
                                {
                                    "itemId": 703224901,
                                    "name": "4c6ebda4-7066-4ed9-b27d-65243908c299",
                                    "value": "Dubai Marina"
                                },
                                {
                                    "itemId": 703224902,
                                    "name": "c7b76cb3-bdcf-4b8c-a63e-b4618adb107e",
                                    "value": "Jones The Grocer - Delta Jbr"
                                },
                                {
                                    "itemId": 703224903,
                                    "name": "4236cdee-7a2e-4bd7-95da-5a2cc6cd42e8",
                                    "value": "Dubai Miracle Garden"
                                }
                            ]
                        }
                    },
                    {
                        "id": 639178033,
                        "items": [
                            703225060,
                            703225061,
                            703225062,
                            703225063,
                            703225064
                        ],
                        "narrativeDescription": {
                            "text": "On the fourth day of your trip to Dubai, start by visiting the {{9bb8c7e8-38b9-489f-a347-72f8958517a0}}, a must-see attraction offering panoramic views of the city. Next, head to the {{36d347bf-fcde-4258-be64-0d01dd74df18}} for a unique experience. For lunch, indulge in delicious Turkish cuisine at {{0e0401eb-dd05-478f-9ebc-1539833d7b07}}. Afterward, relax at the {{78781bf3-b742-4bbf-b886-deae7d3abac4}} before enjoying a tasty dinner at {{af774ac3-702c-4e8c-81bd-f9b07a0b5f2d}}. This day is filled with a perfect blend of sightseeing, great food, and hidden gems, making it a memorable experience for you and your partner.",
                            "plainText": "On the fourth day of your trip to Dubai, start by visiting the Dubai Frame, a must-see attraction offering panoramic views of the city. Next, head to the Dubai Crocodile Park for a unique experience. For lunch, indulge in delicious Turkish cuisine at Bosporus Turkish Cuisine - Boulevard. Afterward, relax at the Ahlan Lounge @ Gate B26 before enjoying a tasty dinner at La Tablita Dubai. This day is filled with a perfect blend of sightseeing, great food, and hidden gems, making it a memorable experience for you and your partner.",
                            "references": [
                                {
                                    "itemId": 703225060,
                                    "name": "9bb8c7e8-38b9-489f-a347-72f8958517a0",
                                    "value": "Dubai Frame"
                                },
                                {
                                    "itemId": 703225061,
                                    "name": "36d347bf-fcde-4258-be64-0d01dd74df18",
                                    "value": "Dubai Crocodile Park"
                                },
                                {
                                    "itemId": 703225062,
                                    "name": "0e0401eb-dd05-478f-9ebc-1539833d7b07",
                                    "value": "Bosporus Turkish Cuisine - Boulevard"
                                },
                                {
                                    "itemId": 703225063,
                                    "name": "78781bf3-b742-4bbf-b886-deae7d3abac4",
                                    "value": "Ahlan Lounge @ Gate B26"
                                },
                                {
                                    "itemId": 703225064,
                                    "name": "af774ac3-702c-4e8c-81bd-f9b07a0b5f2d",
                                    "value": "La Tablita Dubai"
                                }
                            ]
                        }
                    }
                ]
            },
            "items": [
                {
                    "id": 703224687,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelerRankingData",
                                "type": "TravelerRankingData",
                                "rank": 3,
                                "total": 5156
                            },
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "CERTIFICATE_OF_EXCELLENCE",
                                "type": "TravelersChoiceAwardData"
                            }
                        ],
                        "date": null,
                        "recommendedProduct": {
                            "activityId": 24075414,
                            "pricingInfo": {
                                "fromPrice": 164.95,
                                "isTieredPricing": false,
                                "maxTravelersPerUnit": 0,
                                "pricingType": "TRAVELLER_BY_AGE_BAND"
                            },
                            "title": {
                                "text": "Aquarium and Underwater Zoo Dubai Mall "
                            },
                            "route": {
                                "url": "/AttractionProductReview-g295424-d24075414-Aquarium_and_Underwater_Zoo_Dubai_Mall-Dubai_Emirate_of_Dubai.html"
                            }
                        },
                        "narrativeDescription": {
                            "text": "As you explore Dubai with your partner, a visit to {{c877c90d-d58a-4604-9499-5ddf9d5ad035}} is a must for your 4-day itinerary. The mall stands out as the biggest in the world, offering a wide array of shopping and entertainment options that cater to your interests. You'll be amazed by its attractions like the aquarium, underwater zoo, and ice skating rink, as well as the impressive range of restaurants serving culinary delights from around the world. The mall's architectural marvel next to the iconic {{2a4df978-4155-4699-83e3-0a3bdd4425e6}} adds to its charm. Prepare to indulge in shopping for quality products from top brands, though prices might be on the higher side. Despite its popularity, parking may pose a challenge, so plan accordingly for a memorable experience.",
                            "plainText": "As you explore Dubai with your partner, a visit to The Dubai Mall is a must for your 4-day itinerary. The mall stands out as the biggest in the world, offering a wide array of shopping and entertainment options that cater to your interests. You'll be amazed by its attractions like the aquarium, underwater zoo, and ice skating rink, as well as the impressive range of restaurants serving culinary delights from around the world. The mall's architectural marvel next to the iconic Burj Khalifa adds to its charm. Prepare to indulge in shopping for quality products from top brands, though prices might be on the higher side. Despite its popularity, parking may pose a challenge, so plan accordingly for a memorable experience.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "c877c90d-d58a-4604-9499-5ddf9d5ad035",
                                    "value": "The Dubai Mall"
                                },
                                {
                                    "itemId": null,
                                    "name": "2a4df978-4155-4699-83e3-0a3bdd4425e6",
                                    "value": "Burj Khalifa"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 1210327,
                            "object": {
                                "placeType": "ATTRACTION",
                                "isGeo": false,
                                "locationId": 1210327,
                                "latitude": 25.197287,
                                "longitude": 55.279366,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 3,
                                    "popIndexTotal": 5171
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 4.5,
                                    "count": 31588,
                                    "ratingCounts": [
                                        273,
                                        410,
                                        2178,
                                        7916,
                                        20813
                                    ]
                                },
                                "cuisines": [],
                                "price": [],
                                "detail": {
                                    "__typename": "Attraction"
                                },
                                "name": "The Dubai Mall",
                                "geoName": "Dubai",
                                "locationDescription": "This downtown mall is known for luxury stores like Cartier and Harry Winston. It also has an aquarium, ice rink, and 360-degree views of the city from the world’s tallest building, The Burj Khalifa.",
                                "localizedStreetAddress": {
                                    "street1": "Al Mussallah Rd",
                                    "fullAddress": "Al Mussallah Rd Downtown Dubai, Near Souk Al Bahar Bridge, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Attraction_Review-g295424-d1210327-Reviews-The_Dubai_Mall-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Downtown Dubai"
                                    }
                                ],
                                "thumbnail": {
                                    "id": 227281946,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0d/8c/0c/1a/taken-5-years-ago-it.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/0d/8c/0c/1a/taken-5-years-ago-it.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/0d/8c/0c/1a/taken-5-years-ago-it.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/0d/8c/0c/1a/taken-5-years-ago-it.jpg"
                                        },
                                        {
                                            "height": 166,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/0d/8c/0c/1a/taken-5-years-ago-it.jpg"
                                        },
                                        {
                                            "height": 365,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/0d/8c/0c/1a/taken-5-years-ago-it.jpg"
                                        },
                                        {
                                            "height": 679,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/0d/8c/0c/1a/taken-5-years-ago-it.jpg"
                                        },
                                        {
                                            "height": 748,
                                            "width": 1128,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-o/0d/8c/0c/1a/taken-5-years-ago-it.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 129568632,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/07/b9/0f/78/photo0jpg.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/07/b9/0f/78/photo0jpg.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/07/b9/0f/78/photo0jpg.jpg"
                                            },
                                            {
                                                "height": 188,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/07/b9/0f/78/photo0jpg.jpg"
                                            },
                                            {
                                                "height": 413,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/07/b9/0f/78/photo0jpg.jpg"
                                            },
                                            {
                                                "height": 768,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/07/b9/0f/78/photo0jpg.jpg"
                                            },
                                            {
                                                "height": 1536,
                                                "width": 2048,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/07/b9/0f/78/photo0jpg.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 388672721,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/2a/ac/d1/the-dubai-mall.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/17/2a/ac/d1/the-dubai-mall.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 109,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/17/2a/ac/d1/the-dubai-mall.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/17/2a/ac/d1/the-dubai-mall.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/17/2a/ac/d1/the-dubai-mall.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 239,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/17/2a/ac/d1/the-dubai-mall.jpg"
                                            },
                                            {
                                                "height": 1034,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/17/2a/ac/d1/the-dubai-mall.jpg"
                                            },
                                            {
                                                "height": 1280,
                                                "width": 681,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/17/2a/ac/d1/the-dubai-mall.jpg"
                                            },
                                            {
                                                "height": 1925,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/17/2a/ac/d1/the-dubai-mall.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 750250591,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/b7/ea/5f/caption.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/b7/ea/5f/caption.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/b7/ea/5f/caption.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/b7/ea/5f/caption.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 205,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/b7/ea/5f/caption.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 450,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/b7/ea/5f/caption.jpg"
                                            },
                                            {
                                                "height": 550,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/2c/b7/ea/5f/caption.jpg"
                                            },
                                            {
                                                "height": 1024,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/b7/ea/5f/caption.jpg"
                                            },
                                            {
                                                "height": 1280,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/b7/ea/5f/caption.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 750250590,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/b7/ea/5e/caption.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/b7/ea/5e/caption.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/b7/ea/5e/caption.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/b7/ea/5e/caption.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 205,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/b7/ea/5e/caption.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 450,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/b7/ea/5e/caption.jpg"
                                            },
                                            {
                                                "height": 550,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/2c/b7/ea/5e/caption.jpg"
                                            },
                                            {
                                                "height": 1024,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/b7/ea/5e/caption.jpg"
                                            },
                                            {
                                                "height": 1280,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/b7/ea/5e/caption.jpg"
                                            }
                                        ]
                                    }
                                ],
                                "locationV2": {
                                    "rentalDetails": null,
                                    "details": {
                                        "__typename": "LocationSelection_AttractionDetails"
                                    },
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2024,
                                        "awardType": "COE"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    },
                                    "tags": {
                                        "tags": [
                                            {
                                                "tagId": 11155,
                                                "tag": {
                                                    "localizedName": "Shopping Malls"
                                                }
                                            },
                                            {
                                                "tagId": 21243,
                                                "tag": {
                                                    "localizedName": "Athletic/Outdoor Apparel"
                                                }
                                            },
                                            {
                                                "tagId": 21244,
                                                "tag": {
                                                    "localizedName": "Bookstores"
                                                }
                                            },
                                            {
                                                "tagId": 21245,
                                                "tag": {
                                                    "localizedName": "Clothing & Accessories"
                                                }
                                            },
                                            {
                                                "tagId": 21246,
                                                "tag": {
                                                    "localizedName": "Electronics / Camera"
                                                }
                                            },
                                            {
                                                "tagId": 21247,
                                                "tag": {
                                                    "localizedName": "Food & Drink Shops"
                                                }
                                            },
                                            {
                                                "tagId": 21250,
                                                "tag": {
                                                    "localizedName": "Jewelry & Watches"
                                                }
                                            },
                                            {
                                                "tagId": 21252,
                                                "tag": {
                                                    "localizedName": "Makeup and Beauty"
                                                }
                                            },
                                            {
                                                "tagId": 21253,
                                                "tag": {
                                                    "localizedName": "Shoes"
                                                }
                                            },
                                            {
                                                "tagId": 21257,
                                                "tag": {
                                                    "localizedName": "Toys & Games"
                                                }
                                            },
                                            {
                                                "tagId": 21262,
                                                "tag": {
                                                    "localizedName": "Fast Fashion"
                                                }
                                            },
                                            {
                                                "tagId": 21266,
                                                "tag": {
                                                    "localizedName": "Luxury"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "id": 703224688,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_HighlyRecommendedData",
                                "type": "HighlyRecommendedData",
                                "percentRecommended": 99
                            }
                        ],
                        "recommendedProduct": null,
                        "date": null,
                        "narrativeDescription": {
                            "text": "Located in Dubai, {{94bd2c72-69e2-4712-b12c-478c33ab9de7}} offers exceptional service and a wide variety of international cuisines to satisfy your taste buds. The friendly and accommodating staff creates a cozy and comfortable atmosphere, perfect for enjoying a meal with your partner. The reasonable prices make it a great choice for those looking for delicious food without breaking the bank. With your interest in must-see attractions and hidden gems, this restaurant is a great place to experience diverse culinary delights while exploring the local food scene in Dubai.",
                            "plainText": "Located in Dubai, 24th St. World Street Food offers exceptional service and a wide variety of international cuisines to satisfy your taste buds. The friendly and accommodating staff creates a cozy and comfortable atmosphere, perfect for enjoying a meal with your partner. The reasonable prices make it a great choice for those looking for delicious food without breaking the bank. With your interest in must-see attractions and hidden gems, this restaurant is a great place to experience diverse culinary delights while exploring the local food scene in Dubai.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "94bd2c72-69e2-4712-b12c-478c33ab9de7",
                                    "value": "24th St. World Street Food"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 15191936,
                            "object": {
                                "placeType": "EATERY",
                                "isGeo": false,
                                "locationId": 15191936,
                                "latitude": 25.206099,
                                "longitude": 55.272903,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 448,
                                    "popIndexTotal": 8690
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 10,
                                                        "minutes": 30
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 19,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 10,
                                                        "minutes": 30
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 19,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 10,
                                                        "minutes": 30
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 19,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 10,
                                                        "minutes": 30
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 19,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 30
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 10,
                                                        "minutes": 30
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 19,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 30
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 11,
                                                        "minutes": 0
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 12,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 16,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 11,
                                                        "minutes": 0
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 19,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 5,
                                    "count": 2383,
                                    "ratingCounts": [
                                        15,
                                        1,
                                        16,
                                        210,
                                        2144
                                    ]
                                },
                                "detail": {
                                    "__typename": "Restaurant"
                                },
                                "name": "24th St. World Street Food",
                                "geoName": "Dubai",
                                "locationDescription": "Your favorite street-style restaurant with all its specialty kitchens now serves sumptuous buffet spread on Wednesday and Thursday Nights, and Friday and Saturday Brunch. Amplified with a bustling atmosphere, contemporary eclectic décor and stunning views of Burj Khalifa and Dubai cityscape, guests can make their journey through a myriad of bold flavours and spices, not only from the dynamic Asian kitchens of Kim’s Korean, Lucy Wong’s, Momo San and Chatakana, but also from its two new Arabic and Italian kitchens Ali’s and Mario’s. A Group of friends, family, and colleagues with varied taste preferences can enjoyably feast together with 24th St.’s diverse cuisine options.",
                                "localizedStreetAddress": {
                                    "street1": "133 Sheikh Zayed Road",
                                    "fullAddress": "133 Sheikh Zayed Road 24th Floor Dusit Thani, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Restaurant_Review-g295424-d15191936-Reviews-24th_St_World_Street_Food-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Dubai International Financial Centre (DIFC)"
                                    },
                                    {
                                        "name": "Trade Centre"
                                    }
                                ],
                                "cuisines": [
                                    {
                                        "localizedName": "International"
                                    }
                                ],
                                "price": [
                                    {
                                        "localizedName": "$$"
                                    }
                                ],
                                "locationV2": {
                                    "bestAwardForActiveYearV2": null,
                                    "tags": {
                                        "tags": []
                                    },
                                    "rentalDetails": null,
                                    "details": null,
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    }
                                },
                                "thumbnail": {
                                    "id": 466571953,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/cf/52/b1/trip-advisor-certificate.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                        },
                                        {
                                            "height": 205,
                                            "width": 205,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                        },
                                        {
                                            "height": 450,
                                            "width": 450,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                        },
                                        {
                                            "height": 550,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-p/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                        },
                                        {
                                            "height": 1024,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                        },
                                        {
                                            "height": 1080,
                                            "width": 1080,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-o/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 466571953,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/cf/52/b1/trip-advisor-certificate.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 205,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 450,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                            },
                                            {
                                                "height": 550,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                            },
                                            {
                                                "height": 1024,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                            },
                                            {
                                                "height": 1080,
                                                "width": 1080,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/1b/cf/52/b1/trip-advisor-certificate.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 358163096,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/59/22/98/true-korea-at-kims-korean.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/15/59/22/98/true-korea-at-kims-korean.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/15/59/22/98/true-korea-at-kims-korean.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/15/59/22/98/true-korea-at-kims-korean.jpg"
                                            },
                                            {
                                                "height": 141,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/15/59/22/98/true-korea-at-kims-korean.jpg"
                                            },
                                            {
                                                "height": 309,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/15/59/22/98/true-korea-at-kims-korean.jpg"
                                            },
                                            {
                                                "height": 576,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/15/59/22/98/true-korea-at-kims-korean.jpg"
                                            },
                                            {
                                                "height": 720,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/15/59/22/98/true-korea-at-kims-korean.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 482232397,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/be/48/4d/24th-st-new-menu.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/be/48/4d/24th-st-new-menu.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/be/48/4d/24th-st-new-menu.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/be/48/4d/24th-st-new-menu.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/be/48/4d/24th-st-new-menu.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/be/48/4d/24th-st-new-menu.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/be/48/4d/24th-st-new-menu.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1c/be/48/4d/24th-st-new-menu.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 358176381,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/59/56/7d/start-your-morning-right.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/15/59/56/7d/start-your-morning-right.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/15/59/56/7d/start-your-morning-right.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/15/59/56/7d/start-your-morning-right.jpg"
                                            },
                                            {
                                                "height": 141,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/15/59/56/7d/start-your-morning-right.jpg"
                                            },
                                            {
                                                "height": 309,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/15/59/56/7d/start-your-morning-right.jpg"
                                            },
                                            {
                                                "height": 576,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/15/59/56/7d/start-your-morning-right.jpg"
                                            },
                                            {
                                                "height": 576,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/15/59/56/7d/start-your-morning-right.jpg"
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },
                {
                    "id": 703224689,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelerRankingData",
                                "type": "TravelerRankingData",
                                "rank": 6,
                                "total": 5156
                            },
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "BEST_OF_THE_BEST",
                                "type": "TravelersChoiceAwardData"
                            }
                        ],
                        "date": null,
                        "recommendedProduct": {
                            "activityId": 20187930,
                            "pricingInfo": {
                                "fromPrice": 218.1,
                                "isTieredPricing": true,
                                "maxTravelersPerUnit": 0,
                                "pricingType": "TRAVELLER_BY_AGE_BAND"
                            },
                            "title": {
                                "text": "The Burj Khalifa At The Top Observation Deck Admission Ticket"
                            },
                            "route": {
                                "url": "/AttractionProductReview-g295424-d20187930-The_Burj_Khalifa_At_The_Top_Observation_Deck_Admission_Ticket-Dubai_Emirate_of_Dub.html"
                            }
                        },
                        "narrativeDescription": {
                            "text": "As you plan your 4-day trip to Dubai with your partner, consider visiting the iconic {{2a4df978-4155-4699-83e3-0a3bdd4425e6}}. Book tickets online to avoid lines at Dubai Mall and arrive early for sunrise tickets to enjoy a crowd-free experience. For a unique perspective, opt for afternoon slot tickets and stay until sunset to witness breathtaking views. Consider the VIP Pass for access to the exclusive Lounge area. Make sure to check sunset times for the best photo opportunities. As someone interested in must-see attractions, great food, and hidden gems, {{2a4df978-4155-4699-83e3-0a3bdd4425e6}} offers a perfect blend of architectural wonder and stunning vistas for a memorable experience.",
                            "plainText": "As you plan your 4-day trip to Dubai with your partner, consider visiting the iconic Burj Khalifa. Book tickets online to avoid lines at Dubai Mall and arrive early for sunrise tickets to enjoy a crowd-free experience. For a unique perspective, opt for afternoon slot tickets and stay until sunset to witness breathtaking views. Consider the VIP Pass for access to the exclusive Lounge area. Make sure to check sunset times for the best photo opportunities. As someone interested in must-see attractions, great food, and hidden gems, Burj Khalifa offers a perfect blend of architectural wonder and stunning vistas for a memorable experience.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "2a4df978-4155-4699-83e3-0a3bdd4425e6",
                                    "value": "Burj Khalifa"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 676922,
                            "object": {
                                "placeType": "ATTRACTION",
                                "isGeo": false,
                                "locationId": 676922,
                                "latitude": 25.197195,
                                "longitude": 55.274376,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 6,
                                    "popIndexTotal": 5171
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 4.5,
                                    "count": 77411,
                                    "ratingCounts": [
                                        911,
                                        1412,
                                        6426,
                                        17191,
                                        49789
                                    ]
                                },
                                "cuisines": [],
                                "price": [],
                                "detail": {
                                    "__typename": "Attraction"
                                },
                                "name": "Burj Khalifa",
                                "geoName": "Dubai",
                                "locationDescription": "Standing over 2,700 feet and 163 floors high, this record-breaking skyscraper in downtown Dubai is the tallest structure in the world. Burj Khalifa has several open-air viewing decks and swanky lounges which offer splendid views of the UAE and the Persian Gulf. The highest lounge is located at level 154, and there is even a hotel at levels 38 and 39. Designed by Skidmore, Owings & Merrill architects, this mixed-used development atop Dubai Mall is inspired by the Great Mosque of Samarra in Iraq. You might want to buy skip-the-line tickets or join a tour to avoid snaking queues at this popular attraction in Dubai. – Tripadvisor",
                                "localizedStreetAddress": {
                                    "street1": "1 Mohammed Bin Rashid Boulevard",
                                    "fullAddress": "1 Mohammed Bin Rashid Boulevard Downtown Dubai, Dubai 9440 United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Attraction_Review-g295424-d676922-Reviews-Burj_Khalifa-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Downtown Dubai"
                                    }
                                ],
                                "thumbnail": {
                                    "id": 452151699,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/f3/49/93/photo5jpg.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/1a/f3/49/93/photo5jpg.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/1a/f3/49/93/photo5jpg.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/1a/f3/49/93/photo5jpg.jpg"
                                        },
                                        {
                                            "height": 205,
                                            "width": 205,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/1a/f3/49/93/photo5jpg.jpg"
                                        },
                                        {
                                            "height": 450,
                                            "width": 450,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/1a/f3/49/93/photo5jpg.jpg"
                                        },
                                        {
                                            "height": 550,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-p/1a/f3/49/93/photo5jpg.jpg"
                                        },
                                        {
                                            "height": 1024,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/1a/f3/49/93/photo5jpg.jpg"
                                        },
                                        {
                                            "height": 1280,
                                            "width": 1280,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1a/f3/49/93/photo5jpg.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 129721451,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/07/bb/64/6b/photo0jpg.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/07/bb/64/6b/photo0jpg.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/07/bb/64/6b/photo0jpg.jpg"
                                            },
                                            {
                                                "height": 188,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/07/bb/64/6b/photo0jpg.jpg"
                                            },
                                            {
                                                "height": 413,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/07/bb/64/6b/photo0jpg.jpg"
                                            },
                                            {
                                                "height": 768,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/07/bb/64/6b/photo0jpg.jpg"
                                            },
                                            {
                                                "height": 1536,
                                                "width": 2048,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/07/bb/64/6b/photo0jpg.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 384062488,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/16/e4/54/18/burj-khalifa.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/16/e4/54/18/burj-khalifa.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 115,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/16/e4/54/18/burj-khalifa.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/16/e4/54/18/burj-khalifa.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/16/e4/54/18/burj-khalifa.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 253,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/16/e4/54/18/burj-khalifa.jpg"
                                            },
                                            {
                                                "height": 978,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/16/e4/54/18/burj-khalifa.jpg"
                                            },
                                            {
                                                "height": 1152,
                                                "width": 648,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/16/e4/54/18/burj-khalifa.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 365512534,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/c9/47/56/incentive-group-luxuriatours.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/15/c9/47/56/incentive-group-luxuriatours.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/15/c9/47/56/incentive-group-luxuriatours.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/15/c9/47/56/incentive-group-luxuriatours.jpg"
                                            },
                                            {
                                                "height": 188,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/15/c9/47/56/incentive-group-luxuriatours.jpg"
                                            },
                                            {
                                                "height": 413,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/15/c9/47/56/incentive-group-luxuriatours.jpg"
                                            },
                                            {
                                                "height": 768,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/15/c9/47/56/incentive-group-luxuriatours.jpg"
                                            },
                                            {
                                                "height": 960,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/15/c9/47/56/incentive-group-luxuriatours.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 129721452,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/07/bb/64/6c/photo1jpg.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/07/bb/64/6c/photo1jpg.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/07/bb/64/6c/photo1jpg.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 154,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/07/bb/64/6c/photo1jpg.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 338,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/07/bb/64/6c/photo1jpg.jpg"
                                            },
                                            {
                                                "height": 733,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/07/bb/64/6c/photo1jpg.jpg"
                                            },
                                            {
                                                "height": 1365,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/07/bb/64/6c/photo1jpg.jpg"
                                            },
                                            {
                                                "height": 2048,
                                                "width": 1536,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/07/bb/64/6c/photo1jpg.jpg"
                                            }
                                        ]
                                    }
                                ],
                                "locationV2": {
                                    "rentalDetails": null,
                                    "details": {
                                        "__typename": "LocationSelection_AttractionDetails"
                                    },
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2024,
                                        "awardType": "BOTB"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    },
                                    "tags": {
                                        "tags": [
                                            {
                                                "tagId": 11038,
                                                "tag": {
                                                    "localizedName": "Architectural Buildings"
                                                }
                                            },
                                            {
                                                "tagId": 11068,
                                                "tag": {
                                                    "localizedName": "Observation Decks & Towers"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "id": 703224690,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "CERTIFICATE_OF_EXCELLENCE",
                                "type": "TravelersChoiceAwardData"
                            }
                        ],
                        "recommendedProduct": null,
                        "date": null,
                        "narrativeDescription": {
                            "text": "As you explore {{95192ccc-5509-4c66-802c-56f1a9557c94}} in Dubai, you'll be transported back in time to experience the rich heritage of the city. Stroll through well-preserved old homes, visit the Coffee Museum and Dagger Museum, and immerse yourself in the charm of the alleyways and courtyards. This rare authentic attraction offers a glimpse into Dubai's past before modern development, providing cultural insights and delicious coffee and dates at The Sheikh Mohammed Centre for Cultural Understanding. The district also features philately and coin museums, along with a teahouse and restaurant for a taste of local cuisine. With its beautiful architecture, cultural significance, and photo opportunities, this hidden gem is a must-visit for history buffs and food lovers alike.",
                            "plainText": "As you explore Al Fahidi Historical Neighbourhood in Dubai, you'll be transported back in time to experience the rich heritage of the city. Stroll through well-preserved old homes, visit the Coffee Museum and Dagger Museum, and immerse yourself in the charm of the alleyways and courtyards. This rare authentic attraction offers a glimpse into Dubai's past before modern development, providing cultural insights and delicious coffee and dates at The Sheikh Mohammed Centre for Cultural Understanding. The district also features philately and coin museums, along with a teahouse and restaurant for a taste of local cuisine. With its beautiful architecture, cultural significance, and photo opportunities, this hidden gem is a must-visit for history buffs and food lovers alike.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "95192ccc-5509-4c66-802c-56f1a9557c94",
                                    "value": "Al Fahidi Historical Neighbourhood"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 10330716,
                            "object": {
                                "placeType": "ATTRACTION",
                                "isGeo": false,
                                "locationId": 10330716,
                                "latitude": 25.26248,
                                "longitude": 55.29585,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 52,
                                    "popIndexTotal": 5171
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": null,
                                "reviewSummary": {
                                    "rating": 4.5,
                                    "count": 241,
                                    "ratingCounts": [
                                        1,
                                        6,
                                        24,
                                        93,
                                        117
                                    ]
                                },
                                "cuisines": [],
                                "price": [],
                                "detail": {
                                    "__typename": "Attraction"
                                },
                                "name": "Al Fahidi Historical Neighbourhood",
                                "geoName": "Dubai",
                                "locationDescription": null,
                                "localizedStreetAddress": {
                                    "street1": null,
                                    "fullAddress": "Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Attraction_Review-g295424-d10330716-Reviews-Al_Fahidi_Historical_Neighbourhood-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Al Souk Al Kabir"
                                    },
                                    {
                                        "name": "Al Fahidi"
                                    },
                                    {
                                        "name": "The Creek"
                                    },
                                    {
                                        "name": "Bur Dubai"
                                    }
                                ],
                                "thumbnail": {
                                    "id": 392376810,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/63/31/ea/al-fahidi-historical.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/17/63/31/ea/al-fahidi-historical.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/17/63/31/ea/al-fahidi-historical.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/17/63/31/ea/al-fahidi-historical.jpg"
                                        },
                                        {
                                            "height": 188,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/17/63/31/ea/al-fahidi-historical.jpg"
                                        },
                                        {
                                            "height": 413,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/17/63/31/ea/al-fahidi-historical.jpg"
                                        },
                                        {
                                            "height": 768,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/17/63/31/ea/al-fahidi-historical.jpg"
                                        },
                                        {
                                            "height": 960,
                                            "width": 1280,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/17/63/31/ea/al-fahidi-historical.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 191298572,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/66/fc/0c/courtyard-and-wind-tower.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/0b/66/fc/0c/courtyard-and-wind-tower.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/0b/66/fc/0c/courtyard-and-wind-tower.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 154,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/0b/66/fc/0c/courtyard-and-wind-tower.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 338,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/0b/66/fc/0c/courtyard-and-wind-tower.jpg"
                                            },
                                            {
                                                "height": 733,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/0b/66/fc/0c/courtyard-and-wind-tower.jpg"
                                            },
                                            {
                                                "height": 1365,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/0b/66/fc/0c/courtyard-and-wind-tower.jpg"
                                            },
                                            {
                                                "height": 1500,
                                                "width": 1125,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/0b/66/fc/0c/courtyard-and-wind-tower.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 191298567,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/66/fc/07/a-panoramic-view.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/0b/66/fc/07/a-panoramic-view.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/0b/66/fc/07/a-panoramic-view.jpg"
                                            },
                                            {
                                                "height": 188,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/0b/66/fc/07/a-panoramic-view.jpg"
                                            },
                                            {
                                                "height": 413,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/0b/66/fc/07/a-panoramic-view.jpg"
                                            },
                                            {
                                                "height": 768,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/0b/66/fc/07/a-panoramic-view.jpg"
                                            },
                                            {
                                                "height": 1500,
                                                "width": 2000,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/0b/66/fc/07/a-panoramic-view.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 191298552,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/66/fb/f8/wind-tower-and-minaret.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/0b/66/fb/f8/wind-tower-and-minaret.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/0b/66/fb/f8/wind-tower-and-minaret.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 154,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/0b/66/fb/f8/wind-tower-and-minaret.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 338,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/0b/66/fb/f8/wind-tower-and-minaret.jpg"
                                            },
                                            {
                                                "height": 733,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/0b/66/fb/f8/wind-tower-and-minaret.jpg"
                                            },
                                            {
                                                "height": 1365,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/0b/66/fb/f8/wind-tower-and-minaret.jpg"
                                            },
                                            {
                                                "height": 1500,
                                                "width": 1125,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/0b/66/fb/f8/wind-tower-and-minaret.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 191298524,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/66/fb/dc/on-top-of-the-house.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/0b/66/fb/dc/on-top-of-the-house.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/0b/66/fb/dc/on-top-of-the-house.jpg"
                                            },
                                            {
                                                "height": 188,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/0b/66/fb/dc/on-top-of-the-house.jpg"
                                            },
                                            {
                                                "height": 413,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/0b/66/fb/dc/on-top-of-the-house.jpg"
                                            },
                                            {
                                                "height": 768,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/0b/66/fb/dc/on-top-of-the-house.jpg"
                                            },
                                            {
                                                "height": 1500,
                                                "width": 2000,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/0b/66/fb/dc/on-top-of-the-house.jpg"
                                            }
                                        ]
                                    }
                                ],
                                "locationV2": {
                                    "rentalDetails": null,
                                    "details": {
                                        "__typename": "LocationSelection_AttractionDetails"
                                    },
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2024,
                                        "awardType": "COE"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    },
                                    "tags": {
                                        "tags": [
                                            {
                                                "tagId": 11066,
                                                "tag": {
                                                    "localizedName": "Neighborhoods"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "id": 703224691,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "CERTIFICATE_OF_EXCELLENCE",
                                "type": "TravelersChoiceAwardData"
                            }
                        ],
                        "recommendedProduct": null,
                        "date": null,
                        "narrativeDescription": {
                            "text": "{{6d462ecd-8b6d-446c-9e32-00492e3fba9e}} in Dubai offers a lovely atmosphere with great food, making it a perfect spot for you and your partner to enjoy a delicious meal. The restaurant is known for its excellent camel dishes, which are authentic and tasty according to past travelers. The staff is friendly and provides excellent service, adding to the overall dining experience. The menu features local food that is really tasty, and the prices are reasonable. After exploring attractions like {{c877c90d-d58a-4604-9499-5ddf9d5ad035}} and {{2a4df978-4155-4699-83e3-0a3bdd4425e6}}, this hidden gem restaurant is a must-visit for a delectable meal in Dubai.",
                            "plainText": "Local House Restaurant in Dubai offers a lovely atmosphere with great food, making it a perfect spot for you and your partner to enjoy a delicious meal. The restaurant is known for its excellent camel dishes, which are authentic and tasty according to past travelers. The staff is friendly and provides excellent service, adding to the overall dining experience. The menu features local food that is really tasty, and the prices are reasonable. After exploring attractions like The Dubai Mall and Burj Khalifa, this hidden gem restaurant is a must-visit for a delectable meal in Dubai.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "c877c90d-d58a-4604-9499-5ddf9d5ad035",
                                    "value": "The Dubai Mall"
                                },
                                {
                                    "itemId": null,
                                    "name": "2a4df978-4155-4699-83e3-0a3bdd4425e6",
                                    "value": "Burj Khalifa"
                                },
                                {
                                    "itemId": null,
                                    "name": "6d462ecd-8b6d-446c-9e32-00492e3fba9e",
                                    "value": "Local House Restaurant"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 1576961,
                            "object": {
                                "placeType": "EATERY",
                                "isGeo": false,
                                "locationId": 1576961,
                                "latitude": 25.263353,
                                "longitude": 55.299873,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 1285,
                                    "popIndexTotal": 8690
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 4,
                                    "count": 254,
                                    "ratingCounts": [
                                        19,
                                        18,
                                        46,
                                        80,
                                        91
                                    ]
                                },
                                "detail": {
                                    "__typename": "Restaurant"
                                },
                                "name": "Local House Restaurant",
                                "geoName": "Dubai",
                                "locationDescription": "Ever tried a camel burger? Head to the Local House, the first Dubai restaurant to popularise the Arabian delicacy as part of Emirati cuisine. Located within one of the oldest houses in Al Fahidi, the restaurant interiors closely exude the vibe of Old Dubai.",
                                "localizedStreetAddress": {
                                    "street1": "51, Al Fahidi Historical Neighbourhood",
                                    "fullAddress": "51, Al Fahidi Historical Neighbourhood Near Al Fahidi Round About Opp Al Mussallah Post Office Next to Majilis Gallery, Burduba, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Restaurant_Review-g295424-d1576961-Reviews-Local_House_Restaurant-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Al Souk Al Kabir"
                                    },
                                    {
                                        "name": "Al Fahidi"
                                    },
                                    {
                                        "name": "The Creek"
                                    },
                                    {
                                        "name": "Bur Dubai"
                                    }
                                ],
                                "cuisines": [
                                    {
                                        "localizedName": "Middle Eastern"
                                    }
                                ],
                                "price": [
                                    {
                                        "localizedName": "$$"
                                    }
                                ],
                                "locationV2": {
                                    "tags": {
                                        "tags": []
                                    },
                                    "rentalDetails": null,
                                    "details": null,
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2023,
                                        "awardType": "COE"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    }
                                },
                                "thumbnail": {
                                    "id": 712120329,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/72/18/09/our-famous-camel-meat.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/2a/72/18/09/our-famous-camel-meat.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/2a/72/18/09/our-famous-camel-meat.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/2a/72/18/09/our-famous-camel-meat.jpg"
                                        },
                                        {
                                            "height": 205,
                                            "width": 205,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/2a/72/18/09/our-famous-camel-meat.jpg"
                                        },
                                        {
                                            "height": 450,
                                            "width": 450,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/2a/72/18/09/our-famous-camel-meat.jpg"
                                        },
                                        {
                                            "height": 550,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-p/2a/72/18/09/our-famous-camel-meat.jpg"
                                        },
                                        {
                                            "height": 843,
                                            "width": 843,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-o/2a/72/18/09/our-famous-camel-meat.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 712120329,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/72/18/09/our-famous-camel-meat.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2a/72/18/09/our-famous-camel-meat.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2a/72/18/09/our-famous-camel-meat.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2a/72/18/09/our-famous-camel-meat.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 205,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2a/72/18/09/our-famous-camel-meat.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 450,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2a/72/18/09/our-famous-camel-meat.jpg"
                                            },
                                            {
                                                "height": 550,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/2a/72/18/09/our-famous-camel-meat.jpg"
                                            },
                                            {
                                                "height": 843,
                                                "width": 843,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/2a/72/18/09/our-famous-camel-meat.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 712120334,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/72/18/0e/emirati-breakfast.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2a/72/18/0e/emirati-breakfast.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2a/72/18/0e/emirati-breakfast.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2a/72/18/0e/emirati-breakfast.jpg"
                                            },
                                            {
                                                "height": 141,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2a/72/18/0e/emirati-breakfast.jpg"
                                            },
                                            {
                                                "height": 309,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2a/72/18/0e/emirati-breakfast.jpg"
                                            },
                                            {
                                                "height": 576,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2a/72/18/0e/emirati-breakfast.jpg"
                                            },
                                            {
                                                "height": 720,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2a/72/18/0e/emirati-breakfast.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 712120333,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/72/18/0d/emirati-breakfast.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2a/72/18/0d/emirati-breakfast.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2a/72/18/0d/emirati-breakfast.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2a/72/18/0d/emirati-breakfast.jpg"
                                            },
                                            {
                                                "height": 141,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2a/72/18/0d/emirati-breakfast.jpg"
                                            },
                                            {
                                                "height": 309,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2a/72/18/0d/emirati-breakfast.jpg"
                                            },
                                            {
                                                "height": 576,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2a/72/18/0d/emirati-breakfast.jpg"
                                            },
                                            {
                                                "height": 720,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2a/72/18/0d/emirati-breakfast.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 712120332,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/72/18/0c/arabian-foul-a-famous.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2a/72/18/0c/arabian-foul-a-famous.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2a/72/18/0c/arabian-foul-a-famous.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2a/72/18/0c/arabian-foul-a-famous.jpg"
                                            },
                                            {
                                                "height": 141,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2a/72/18/0c/arabian-foul-a-famous.jpg"
                                            },
                                            {
                                                "height": 309,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2a/72/18/0c/arabian-foul-a-famous.jpg"
                                            },
                                            {
                                                "height": 576,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2a/72/18/0c/arabian-foul-a-famous.jpg"
                                            },
                                            {
                                                "height": 720,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2a/72/18/0c/arabian-foul-a-famous.jpg"
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },
                {
                    "id": 703224732,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "CERTIFICATE_OF_EXCELLENCE",
                                "type": "TravelersChoiceAwardData"
                            }
                        ],
                        "recommendedProduct": null,
                        "date": null,
                        "narrativeDescription": {
                            "text": "{{37aec42a-9f00-4383-8d62-8e183231df61}} in Dubai is a charming area that offers a glimpse into historic Dubai. As a lover of art and history, you will appreciate the well-preserved mud houses, interesting cafes, and shops that line the alleys. The street art adds character to the place, and you might even spot a camel and its baby roaming around. The area is meticulously maintained, making it a hidden gem for those who enjoy exploring off-the-beaten-path locations. Walking through the alleys, you will feel the charm of this quaint quarter and appreciate the effort put into restoring it. It's a perfect spot to immerse yourself in Dubai's rich culture and history.",
                            "plainText": "Bastakia Quarter in Dubai is a charming area that offers a glimpse into historic Dubai. As a lover of art and history, you will appreciate the well-preserved mud houses, interesting cafes, and shops that line the alleys. The street art adds character to the place, and you might even spot a camel and its baby roaming around. The area is meticulously maintained, making it a hidden gem for those who enjoy exploring off-the-beaten-path locations. Walking through the alleys, you will feel the charm of this quaint quarter and appreciate the effort put into restoring it. It's a perfect spot to immerse yourself in Dubai's rich culture and history.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "37aec42a-9f00-4383-8d62-8e183231df61",
                                    "value": "Bastakia Quarter"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 478894,
                            "object": {
                                "placeType": "ATTRACTION",
                                "isGeo": false,
                                "locationId": 478894,
                                "latitude": 25.264235,
                                "longitude": 55.300266,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 69,
                                    "popIndexTotal": 5171
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": null,
                                "reviewSummary": {
                                    "rating": 4,
                                    "count": 978,
                                    "ratingCounts": [
                                        9,
                                        27,
                                        136,
                                        420,
                                        386
                                    ]
                                },
                                "cuisines": [],
                                "price": [],
                                "detail": {
                                    "__typename": "Attraction"
                                },
                                "name": "Al Fahidi Historical Neighbourhood",
                                "geoName": "Dubai",
                                "locationDescription": "A visit to the Bastakiya Quarter includes culturally significant sights, such as Dubai's oldest building (1780s), the Al Fahidi Fort, the Dubai Museum, and the Sheikh Mohammed Centre for Cultural Understanding (SMCCU).",
                                "localizedStreetAddress": {
                                    "street1": null,
                                    "fullAddress": "Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Attraction_Review-g295424-d478894-Reviews-Al_Fahidi_Historical_Neighbourhood-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Al Souk Al Kabir"
                                    },
                                    {
                                        "name": "Al Fahidi"
                                    },
                                    {
                                        "name": "The Creek"
                                    },
                                    {
                                        "name": "Bur Dubai"
                                    }
                                ],
                                "thumbnail": {
                                    "id": 376013133,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/16/69/81/4d/img-20190106-200444-largejpg.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/16/69/81/4d/img-20190106-200444-largejpg.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/16/69/81/4d/img-20190106-200444-largejpg.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/16/69/81/4d/img-20190106-200444-largejpg.jpg"
                                        },
                                        {
                                            "height": 186,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/16/69/81/4d/img-20190106-200444-largejpg.jpg"
                                        },
                                        {
                                            "height": 410,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/16/69/81/4d/img-20190106-200444-largejpg.jpg"
                                        },
                                        {
                                            "height": 683,
                                            "width": 916,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-o/16/69/81/4d/img-20190106-200444-largejpg.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 59528502,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/03/8c/55/36/al-bastakiya.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/03/8c/55/36/al-bastakiya.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/03/8c/55/36/al-bastakiya.jpg"
                                            },
                                            {
                                                "height": 187,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/03/8c/55/36/al-bastakiya.jpg"
                                            },
                                            {
                                                "height": 412,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/03/8c/55/36/al-bastakiya.jpg"
                                            },
                                            {
                                                "height": 768,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/03/8c/55/36/al-bastakiya.jpg"
                                            },
                                            {
                                                "height": 1500,
                                                "width": 2000,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/03/8c/55/36/al-bastakiya.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 1857719,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-s/00/1c/58/b7/dubai-bastakia-narrow.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/00/1c/58/b7/dubai-bastakia-narrow.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/00/1c/58/b7/dubai-bastakia-narrow.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 153,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/00/1c/58/b7/dubai-bastakia-narrow.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 337,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/00/1c/58/b7/dubai-bastakia-narrow.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 728195336,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/67/61/08/caption.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2b/67/61/08/caption.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2b/67/61/08/caption.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2b/67/61/08/caption.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2b/67/61/08/caption.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2b/67/61/08/caption.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2b/67/61/08/caption.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2b/67/61/08/caption.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 728195296,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/67/60/e0/caption.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2b/67/60/e0/caption.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2b/67/60/e0/caption.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2b/67/60/e0/caption.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2b/67/60/e0/caption.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2b/67/60/e0/caption.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2b/67/60/e0/caption.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2b/67/60/e0/caption.jpg"
                                            }
                                        ]
                                    }
                                ],
                                "locationV2": {
                                    "rentalDetails": null,
                                    "details": {
                                        "__typename": "LocationSelection_AttractionDetails"
                                    },
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2024,
                                        "awardType": "COE"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    },
                                    "tags": {
                                        "tags": [
                                            {
                                                "tagId": 11052,
                                                "tag": {
                                                    "localizedName": "Historic Walking Areas"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "id": 703224733,
                    "object": {
                        "comments": [],
                        "communityContent": [],
                        "recommendedProduct": null,
                        "date": null,
                        "narrativeDescription": {
                            "text": "During your trip to Dubai, make sure to check out {{2bcf96ea-1b40-43e9-acf9-1db82342da32}}, a restaurant that serves a variety of dishes beyond just falafels. Past visitors highly recommend trying the Special Falafel and Green Falafel options. Known for being a good, affordable dining choice in the area, {{2bcf96ea-1b40-43e9-acf9-1db82342da32}} prides itself on delicious food, friendly staff, and a clean environment. Be sure to indulge in their signature sandwiches and falafel, as they come highly recommended. This spot perfectly combines your love for trying new cuisines with your desire to experience hidden gems while exploring Dubai with your partner.",
                            "plainText": "During your trip to Dubai, make sure to check out Operation Falafel, a restaurant that serves a variety of dishes beyond just falafels. Past visitors highly recommend trying the Special Falafel and Green Falafel options. Known for being a good, affordable dining choice in the area, Operation Falafel prides itself on delicious food, friendly staff, and a clean environment. Be sure to indulge in their signature sandwiches and falafel, as they come highly recommended. This spot perfectly combines your love for trying new cuisines with your desire to experience hidden gems while exploring Dubai with your partner.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "2bcf96ea-1b40-43e9-acf9-1db82342da32",
                                    "value": "Operation Falafel"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 17586663,
                            "object": {
                                "placeType": "EATERY",
                                "isGeo": false,
                                "locationId": 17586663,
                                "latitude": 25.191238,
                                "longitude": 55.273247,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 2007,
                                    "popIndexTotal": 8690
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 4.5,
                                    "count": 26,
                                    "ratingCounts": [
                                        1,
                                        0,
                                        2,
                                        8,
                                        15
                                    ]
                                },
                                "detail": {
                                    "__typename": "Restaurant"
                                },
                                "name": "Operation Falafel",
                                "geoName": "Dubai",
                                "locationDescription": "Operation: Falafel is the Group’s flagship restaurant with a unique Twenty- First century take on restaurants serving casual street food to the adventurous palate. It serves traditional Arabic street food with an edgy and unconventional theme. The urban and industrial elements create interesting dining spaces with a concept. An open kitchen not only keeps the look and feel contemporary, but also utilizes a practical design solution that requires minimum physical space.",
                                "localizedStreetAddress": {
                                    "street1": "Opposite Vida Hotel, Sheikh Mohammad Bin Rashid Boulevard, Downtown Dubai",
                                    "fullAddress": "Opposite Vida Hotel, Sheikh Mohammad Bin Rashid Boulevard, Downtown Dubai, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Restaurant_Review-g295424-d17586663-Reviews-Operation_Falafel-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Downtown Dubai"
                                    }
                                ],
                                "cuisines": [
                                    {
                                        "localizedName": "Lebanese"
                                    },
                                    {
                                        "localizedName": "Middle Eastern"
                                    },
                                    {
                                        "localizedName": "Mediterranean"
                                    }
                                ],
                                "price": [
                                    {
                                        "localizedName": "$"
                                    }
                                ],
                                "locationV2": {
                                    "bestAwardForActiveYearV2": null,
                                    "tags": {
                                        "tags": []
                                    },
                                    "rentalDetails": null,
                                    "details": null,
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    }
                                },
                                "thumbnail": {
                                    "id": 704853694,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/03/36/be/some-of-our-delicious.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/2a/03/36/be/some-of-our-delicious.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/2a/03/36/be/some-of-our-delicious.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/2a/03/36/be/some-of-our-delicious.jpg"
                                        },
                                        {
                                            "height": 131,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/2a/03/36/be/some-of-our-delicious.jpg"
                                        },
                                        {
                                            "height": 288,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/2a/03/36/be/some-of-our-delicious.jpg"
                                        },
                                        {
                                            "height": 536,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/2a/03/36/be/some-of-our-delicious.jpg"
                                        },
                                        {
                                            "height": 628,
                                            "width": 1200,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-o/2a/03/36/be/some-of-our-delicious.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 704853694,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/03/36/be/some-of-our-delicious.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2a/03/36/be/some-of-our-delicious.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2a/03/36/be/some-of-our-delicious.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2a/03/36/be/some-of-our-delicious.jpg"
                                            },
                                            {
                                                "height": 131,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2a/03/36/be/some-of-our-delicious.jpg"
                                            },
                                            {
                                                "height": 288,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2a/03/36/be/some-of-our-delicious.jpg"
                                            },
                                            {
                                                "height": 536,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2a/03/36/be/some-of-our-delicious.jpg"
                                            },
                                            {
                                                "height": 628,
                                                "width": 1200,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/2a/03/36/be/some-of-our-delicious.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 482358602,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/c0/35/4a/o.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/c0/35/4a/o.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/c0/35/4a/o.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/c0/35/4a/o.jpg"
                                            },
                                            {
                                                "height": 188,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/c0/35/4a/o.jpg"
                                            },
                                            {
                                                "height": 413,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/c0/35/4a/o.jpg"
                                            },
                                            {
                                                "height": 769,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/c0/35/4a/o.jpg"
                                            },
                                            {
                                                "height": 961,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/1c/c0/35/4a/o.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 448789467,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/bf/fb/db/menu.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1a/bf/fb/db/menu.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1a/bf/fb/db/menu.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1a/bf/fb/db/menu.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1a/bf/fb/db/menu.jpg"
                                            },
                                            {
                                                "height": 440,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1a/bf/fb/db/menu.jpg"
                                            },
                                            {
                                                "height": 819,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1a/bf/fb/db/menu.jpg"
                                            },
                                            {
                                                "height": 1024,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1a/bf/fb/db/menu.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 484567666,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/e1/ea/72/o-f.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/e1/ea/72/o-f.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/e1/ea/72/o-f.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 158,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/e1/ea/72/o-f.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/e1/ea/72/o-f.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 346,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/e1/ea/72/o-f.jpg"
                                            },
                                            {
                                                "height": 715,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/1c/e1/ea/72/o-f.jpg"
                                            },
                                            {
                                                "height": 1280,
                                                "width": 985,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1c/e1/ea/72/o-f.jpg"
                                            },
                                            {
                                                "height": 1331,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/e1/ea/72/o-f.jpg"
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },
                {
                    "id": 703224734,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelerRankingData",
                                "type": "TravelerRankingData",
                                "rank": 2,
                                "total": 5156
                            },
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "BEST_OF_THE_BEST",
                                "type": "TravelersChoiceAwardData"
                            },
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "CERTIFICATE_OF_EXCELLENCE",
                                "type": "TravelersChoiceAwardData"
                            }
                        ],
                        "date": null,
                        "recommendedProduct": {
                            "activityId": 24897279,
                            "pricingInfo": {
                                "fromPrice": 99.05,
                                "isTieredPricing": true,
                                "maxTravelersPerUnit": 0,
                                "pricingType": "TRAVELLER_BY_AGE_BAND"
                            },
                            "title": {
                                "text": "Dubai Fountain Show Boat Lake Ride Ticket"
                            },
                            "route": {
                                "url": "/AttractionProductReview-g295424-d24897279-Dubai_Fountain_Show_Boat_Lake_Ride_Ticket-Dubai_Emirate_of_Dubai.html"
                            }
                        },
                        "narrativeDescription": {
                            "text": "{{2024841a-ac1e-4b54-8302-c8cba57cdc6f}} is a captivating attraction that offers great views and ambience, especially at sunset. The mesmerizing fountain display is a must-see experience that never fails to uplift your mood. You can enjoy the show from the same level or opt for a higher vantage point at nearby restaurants. While the crowd can be large, the stunning views make it worthwhile. As a fan of must-see attractions and great food, you will appreciate the combination of a fantastic fountain show with the opportunity to dine at one of the restaurants overlooking the display. {{2024841a-ac1e-4b54-8302-c8cba57cdc6f}} is a delightful addition to your itinerary.",
                            "plainText": "The Dubai Fountain is a captivating attraction that offers great views and ambience, especially at sunset. The mesmerizing fountain display is a must-see experience that never fails to uplift your mood. You can enjoy the show from the same level or opt for a higher vantage point at nearby restaurants. While the crowd can be large, the stunning views make it worthwhile. As a fan of must-see attractions and great food, you will appreciate the combination of a fantastic fountain show with the opportunity to dine at one of the restaurants overlooking the display. The Dubai Fountain is a delightful addition to your itinerary.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "2024841a-ac1e-4b54-8302-c8cba57cdc6f",
                                    "value": "The Dubai Fountain"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 1936354,
                            "object": {
                                "placeType": "ATTRACTION",
                                "isGeo": false,
                                "locationId": 1936354,
                                "latitude": 25.195227,
                                "longitude": 55.275406,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 2,
                                    "popIndexTotal": 5171
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": null,
                                "reviewSummary": {
                                    "rating": 4.5,
                                    "count": 75968,
                                    "ratingCounts": [
                                        300,
                                        704,
                                        4325,
                                        15369,
                                        55241
                                    ]
                                },
                                "cuisines": [],
                                "price": [],
                                "detail": {
                                    "__typename": "Attraction"
                                },
                                "name": "The Dubai Fountain",
                                "geoName": "Dubai",
                                "locationDescription": "Choreographed to music, the Dubai Fountain shoots water as high as 500 feet –that’s as high as a 50-story building. Designed by creators of the Fountains of Bellagio in Vegas, Dubai Fountain Performances occur daily on the 30-acre Burj Khalifa Lake.",
                                "localizedStreetAddress": {
                                    "street1": "Financial Centre Road",
                                    "fullAddress": "Financial Centre Road Dubai Mall, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Attraction_Review-g295424-d1936354-Reviews-The_Dubai_Fountain-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Downtown Dubai"
                                    }
                                ],
                                "thumbnail": {
                                    "id": 453318940,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/05/19/1c/the-dubai-fountain.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/1b/05/19/1c/the-dubai-fountain.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/1b/05/19/1c/the-dubai-fountain.jpg"
                                        },
                                        {
                                            "height": 205,
                                            "width": 154,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/1b/05/19/1c/the-dubai-fountain.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/1b/05/19/1c/the-dubai-fountain.jpg"
                                        },
                                        {
                                            "height": 450,
                                            "width": 338,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/1b/05/19/1c/the-dubai-fountain.jpg"
                                        },
                                        {
                                            "height": 733,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-p/1b/05/19/1c/the-dubai-fountain.jpg"
                                        },
                                        {
                                            "height": 1280,
                                            "width": 960,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1b/05/19/1c/the-dubai-fountain.jpg"
                                        },
                                        {
                                            "height": 1365,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/1b/05/19/1c/the-dubai-fountain.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 375238211,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/16/5d/ae/43/arabian-private-adventure.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/16/5d/ae/43/arabian-private-adventure.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/16/5d/ae/43/arabian-private-adventure.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/16/5d/ae/43/arabian-private-adventure.jpg"
                                            },
                                            {
                                                "height": 188,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/16/5d/ae/43/arabian-private-adventure.jpg"
                                            },
                                            {
                                                "height": 413,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/16/5d/ae/43/arabian-private-adventure.jpg"
                                            },
                                            {
                                                "height": 720,
                                                "width": 960,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/16/5d/ae/43/arabian-private-adventure.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 750516057,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/bb/f7/59/caption.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/bb/f7/59/caption.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/bb/f7/59/caption.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 154,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/bb/f7/59/caption.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/bb/f7/59/caption.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 338,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/bb/f7/59/caption.jpg"
                                            },
                                            {
                                                "height": 732,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/2c/bb/f7/59/caption.jpg"
                                            },
                                            {
                                                "height": 1280,
                                                "width": 961,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/bb/f7/59/caption.jpg"
                                            },
                                            {
                                                "height": 1364,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/bb/f7/59/caption.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 749918958,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/b2/da/ee/caption.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/b2/da/ee/caption.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/b2/da/ee/caption.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 154,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/b2/da/ee/caption.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/b2/da/ee/caption.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 338,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/b2/da/ee/caption.jpg"
                                            },
                                            {
                                                "height": 733,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/2c/b2/da/ee/caption.jpg"
                                            },
                                            {
                                                "height": 1280,
                                                "width": 960,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/b2/da/ee/caption.jpg"
                                            },
                                            {
                                                "height": 1365,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/b2/da/ee/caption.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 747602260,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/8f/81/54/caption.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/8f/81/54/caption.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/8f/81/54/caption.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 154,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/8f/81/54/caption.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/8f/81/54/caption.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 338,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/8f/81/54/caption.jpg"
                                            },
                                            {
                                                "height": 733,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/2c/8f/81/54/caption.jpg"
                                            },
                                            {
                                                "height": 1280,
                                                "width": 960,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/8f/81/54/caption.jpg"
                                            },
                                            {
                                                "height": 1365,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/8f/81/54/caption.jpg"
                                            }
                                        ]
                                    }
                                ],
                                "locationV2": {
                                    "rentalDetails": null,
                                    "details": {
                                        "__typename": "LocationSelection_AttractionDetails"
                                    },
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2024,
                                        "awardType": "BOTB"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    },
                                    "tags": {
                                        "tags": [
                                            {
                                                "tagId": 11048,
                                                "tag": {
                                                    "localizedName": "Fountains"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "id": 703224735,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "BEST_OF_THE_BEST",
                                "type": "TravelersChoiceAwardData"
                            },
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "CERTIFICATE_OF_EXCELLENCE",
                                "type": "TravelersChoiceAwardData"
                            }
                        ],
                        "date": null,
                        "recommendedProduct": {
                            "activityId": 13354249,
                            "pricingInfo": {
                                "fromPrice": 380.97,
                                "isTieredPricing": true,
                                "maxTravelersPerUnit": 0,
                                "pricingType": "TRAVELLER_BY_AGE_BAND"
                            },
                            "title": {
                                "text": "Dubai Creek Dhow Dinner Cruise"
                            },
                            "route": {
                                "url": "/AttractionProductReview-g295424-d13354249-Dubai_Creek_Dhow_Dinner_Cruise-Dubai_Emirate_of_Dubai.html"
                            }
                        },
                        "narrativeDescription": {
                            "text": "{{6a4ecb61-80f5-4490-8bd6-ec823dc06fbb}} is a vibrant area where you can experience the old Dubai and enjoy a traditional 'Abra' ride on the water, offering a unique glimpse into the city's past. It is conveniently close to the Radisson Blue hotel at Deira, making it easily accessible for you and your partner during your 4-day stay. The charming atmosphere, along with the opportunity to explore by day or night, makes it a picturesque location worth visiting. The short Abra ride, lasting around 5 minutes, provides a relaxing break from the daytime heat, allowing you to immerse yourself in the beauty of the surroundings.",
                            "plainText": "Dubai Creek is a vibrant area where you can experience the old Dubai and enjoy a traditional 'Abra' ride on the water, offering a unique glimpse into the city's past. It is conveniently close to the Radisson Blue hotel at Deira, making it easily accessible for you and your partner during your 4-day stay. The charming atmosphere, along with the opportunity to explore by day or night, makes it a picturesque location worth visiting. The short Abra ride, lasting around 5 minutes, provides a relaxing break from the daytime heat, allowing you to immerse yourself in the beauty of the surroundings.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "6a4ecb61-80f5-4490-8bd6-ec823dc06fbb",
                                    "value": "Dubai Creek"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 324481,
                            "object": {
                                "placeType": "ATTRACTION",
                                "isGeo": false,
                                "locationId": 324481,
                                "latitude": 25.216955,
                                "longitude": 55.34637,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 53,
                                    "popIndexTotal": 5171
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": null,
                                "reviewSummary": {
                                    "rating": 4.5,
                                    "count": 9908,
                                    "ratingCounts": [
                                        76,
                                        159,
                                        1126,
                                        3897,
                                        4650
                                    ]
                                },
                                "cuisines": [],
                                "price": [],
                                "detail": {
                                    "__typename": "Attraction"
                                },
                                "name": "Dubai Creek",
                                "geoName": "Dubai",
                                "locationDescription": "Separating Deira and Bur Dubai, the creek is the city's historic commercial hub. Explore and cross the canal on a traditional abra boat ride.",
                                "localizedStreetAddress": {
                                    "street1": null,
                                    "fullAddress": "Mashraf Building, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Attraction_Review-g295424-d324481-Reviews-Dubai_Creek-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Al Souk Al Kabir"
                                    },
                                    {
                                        "name": "Al Fahidi"
                                    },
                                    {
                                        "name": "The Creek"
                                    },
                                    {
                                        "name": "Bur Dubai"
                                    }
                                ],
                                "thumbnail": {
                                    "id": 449245852,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/c6/f2/9c/20200115-140413-largejpg.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/1a/c6/f2/9c/20200115-140413-largejpg.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/1a/c6/f2/9c/20200115-140413-largejpg.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/1a/c6/f2/9c/20200115-140413-largejpg.jpg"
                                        },
                                        {
                                            "height": 141,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/1a/c6/f2/9c/20200115-140413-largejpg.jpg"
                                        },
                                        {
                                            "height": 309,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/1a/c6/f2/9c/20200115-140413-largejpg.jpg"
                                        },
                                        {
                                            "height": 576,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/1a/c6/f2/9c/20200115-140413-largejpg.jpg"
                                        },
                                        {
                                            "height": 648,
                                            "width": 1152,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-o/1a/c6/f2/9c/20200115-140413-largejpg.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 133686139,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/07/f7/e3/7b/dubai-creek.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/07/f7/e3/7b/dubai-creek.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/07/f7/e3/7b/dubai-creek.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/07/f7/e3/7b/dubai-creek.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/07/f7/e3/7b/dubai-creek.jpg"
                                            },
                                            {
                                                "height": 682,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/07/f7/e3/7b/dubai-creek.jpg"
                                            },
                                            {
                                                "height": 1333,
                                                "width": 2000,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/07/f7/e3/7b/dubai-creek.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 49087476,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/02/ed/03/f4/dubai-creek.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/02/ed/03/f4/dubai-creek.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/02/ed/03/f4/dubai-creek.jpg"
                                            },
                                            {
                                                "height": 187,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/02/ed/03/f4/dubai-creek.jpg"
                                            },
                                            {
                                                "height": 412,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/02/ed/03/f4/dubai-creek.jpg"
                                            },
                                            {
                                                "height": 768,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/02/ed/03/f4/dubai-creek.jpg"
                                            },
                                            {
                                                "height": 1500,
                                                "width": 2000,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/02/ed/03/f4/dubai-creek.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 1109111,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-s/00/10/ec/77/view-on-the-creek.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/00/10/ec/77/view-on-the-creek.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/00/10/ec/77/view-on-the-creek.jpg"
                                            },
                                            {
                                                "height": 187,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/00/10/ec/77/view-on-the-creek.jpg"
                                            },
                                            {
                                                "height": 412,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/00/10/ec/77/view-on-the-creek.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 728193959,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/67/5b/a7/caption.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2b/67/5b/a7/caption.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2b/67/5b/a7/caption.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2b/67/5b/a7/caption.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2b/67/5b/a7/caption.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2b/67/5b/a7/caption.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2b/67/5b/a7/caption.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2b/67/5b/a7/caption.jpg"
                                            }
                                        ]
                                    }
                                ],
                                "locationV2": {
                                    "rentalDetails": null,
                                    "details": {
                                        "__typename": "LocationSelection_AttractionDetails"
                                    },
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2024,
                                        "awardType": "BOTB"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    },
                                    "tags": {
                                        "tags": [
                                            {
                                                "tagId": 11075,
                                                "tag": {
                                                    "localizedName": "Piers & Boardwalks"
                                                }
                                            },
                                            {
                                                "tagId": 11159,
                                                "tag": {
                                                    "localizedName": "Bodies of Water"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "id": 703224736,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "CERTIFICATE_OF_EXCELLENCE",
                                "type": "TravelersChoiceAwardData"
                            },
                            {
                                "__typename": "Trips_HighlyRecommendedData",
                                "type": "HighlyRecommendedData",
                                "percentRecommended": 99
                            }
                        ],
                        "recommendedProduct": null,
                        "date": null,
                        "narrativeDescription": {
                            "text": "{{efe2007d-21cc-425e-8087-57a97dc02f7d}} in Dubai offers a lovely atmosphere with beautiful decorations and stunning views of the city. Known for its great food, delicious cocktails, and pleasant music, this eatery is highly recommended for a night out with friends. Past visitors have raved about the fresh and delicious sushi, tasty cocktails, and excellent service from polite staff. The tropical atmosphere, beautiful indoor decoration resembling a botanical garden, and cool beats from the DJ create a unique dining experience. If you appreciate good food, great music, and attentive service, {{efe2007d-21cc-425e-8087-57a97dc02f7d}} is a hidden gem in Dubai that you should definitely consider visiting with your partner.",
                            "plainText": "Secret Garden by VII in Dubai offers a lovely atmosphere with beautiful decorations and stunning views of the city. Known for its great food, delicious cocktails, and pleasant music, this eatery is highly recommended for a night out with friends. Past visitors have raved about the fresh and delicious sushi, tasty cocktails, and excellent service from polite staff. The tropical atmosphere, beautiful indoor decoration resembling a botanical garden, and cool beats from the DJ create a unique dining experience. If you appreciate good food, great music, and attentive service, Secret Garden by VII is a hidden gem in Dubai that you should definitely consider visiting with your partner.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "efe2007d-21cc-425e-8087-57a97dc02f7d",
                                    "value": "Secret Garden by VII"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 20215295,
                            "object": {
                                "placeType": "EATERY",
                                "isGeo": false,
                                "locationId": 20215295,
                                "latitude": 25.1994,
                                "longitude": 55.2741,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 759,
                                    "popIndexTotal": 8690
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 3,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 3,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 3,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 3,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 3,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 15,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 3,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 3,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 5,
                                    "count": 521,
                                    "ratingCounts": [
                                        4,
                                        0,
                                        3,
                                        7,
                                        507
                                    ]
                                },
                                "detail": {
                                    "__typename": "Restaurant"
                                },
                                "name": "Secret Garden by VII",
                                "geoName": "Dubai",
                                "locationDescription": "Delight your palate in our gourmet dishes while being entertained with live music, themed nights & offers daily.",
                                "localizedStreetAddress": {
                                    "street1": "Sheikh Zayed Rd",
                                    "fullAddress": "Sheikh Zayed Rd 7th Floor, Conrad Dubai, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Restaurant_Review-g295424-d20215295-Reviews-Secret_Garden_by_VII-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Downtown Dubai"
                                    }
                                ],
                                "cuisines": [
                                    {
                                        "localizedName": "Bar"
                                    },
                                    {
                                        "localizedName": "Seafood"
                                    },
                                    {
                                        "localizedName": "Fast Food"
                                    },
                                    {
                                        "localizedName": "Sushi"
                                    },
                                    {
                                        "localizedName": "Wine Bar"
                                    }
                                ],
                                "price": [
                                    {
                                        "localizedName": "$$$$"
                                    }
                                ],
                                "locationV2": {
                                    "tags": {
                                        "tags": []
                                    },
                                    "rentalDetails": null,
                                    "details": null,
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2023,
                                        "awardType": "COE"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    }
                                },
                                "thumbnail": {
                                    "id": 471905553,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/20/b5/11/sliders.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/20/b5/11/sliders.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/20/b5/11/sliders.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/20/b5/11/sliders.jpg"
                                        },
                                        {
                                            "height": 167,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/20/b5/11/sliders.jpg"
                                        },
                                        {
                                            "height": 367,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/20/b5/11/sliders.jpg"
                                        },
                                        {
                                            "height": 683,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/20/b5/11/sliders.jpg"
                                        },
                                        {
                                            "height": 854,
                                            "width": 1280,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1c/20/b5/11/sliders.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 450869886,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/df/ba/7e/getlstd-property-photo.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1a/df/ba/7e/getlstd-property-photo.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1a/df/ba/7e/getlstd-property-photo.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1a/df/ba/7e/getlstd-property-photo.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1a/df/ba/7e/getlstd-property-photo.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1a/df/ba/7e/getlstd-property-photo.jpg"
                                            },
                                            {
                                                "height": 682,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1a/df/ba/7e/getlstd-property-photo.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1a/df/ba/7e/getlstd-property-photo.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 471905648,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/20/b5/70/cheese-platter.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/20/b5/70/cheese-platter.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/20/b5/70/cheese-platter.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/20/b5/70/cheese-platter.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/20/b5/70/cheese-platter.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/20/b5/70/cheese-platter.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/20/b5/70/cheese-platter.jpg"
                                            },
                                            {
                                                "height": 854,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1c/20/b5/70/cheese-platter.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 471905627,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/20/b5/5b/sushi.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/20/b5/5b/sushi.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/20/b5/5b/sushi.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/20/b5/5b/sushi.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/20/b5/5b/sushi.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/20/b5/5b/sushi.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/20/b5/5b/sushi.jpg"
                                            },
                                            {
                                                "height": 854,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1c/20/b5/5b/sushi.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 471905620,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/20/b5/54/sushi.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/20/b5/54/sushi.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/20/b5/54/sushi.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/20/b5/54/sushi.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/20/b5/54/sushi.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/20/b5/54/sushi.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/20/b5/54/sushi.jpg"
                                            },
                                            {
                                                "height": 854,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1c/20/b5/54/sushi.jpg"
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },
                {
                    "id": 703224899,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "CERTIFICATE_OF_EXCELLENCE",
                                "type": "TravelersChoiceAwardData"
                            },
                            {
                                "__typename": "Trips_HighlyRecommendedData",
                                "type": "HighlyRecommendedData",
                                "percentRecommended": 97
                            }
                        ],
                        "recommendedProduct": null,
                        "date": null,
                        "narrativeDescription": {
                            "text": "Located in Dubai, {{223ad8a8-80fe-433a-9713-6df80703a513}} offers delicious food, great service, and a vibrant atmosphere. With a wide variety of food options, including live stations and buffets, you and your partner can enjoy a culinary adventure. The extremely friendly staff will make you feel welcome as you indulge in tasty and varied dishes. In addition to the excellent food, the restaurant also provides neat and clean rooms, friendly service, and a good breakfast. This dining experience at {{223ad8a8-80fe-433a-9713-6df80703a513}} is sure to be a highlight of your trip to Dubai, satisfying your love for good food and friendly service.",
                            "plainText": "Located in Dubai, Local - TRYP by Wyndham offers delicious food, great service, and a vibrant atmosphere. With a wide variety of food options, including live stations and buffets, you and your partner can enjoy a culinary adventure. The extremely friendly staff will make you feel welcome as you indulge in tasty and varied dishes. In addition to the excellent food, the restaurant also provides neat and clean rooms, friendly service, and a good breakfast. This dining experience at Local - TRYP by Wyndham is sure to be a highlight of your trip to Dubai, satisfying your love for good food and friendly service.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "223ad8a8-80fe-433a-9713-6df80703a513",
                                    "value": "Local - TRYP by Wyndham"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 13294520,
                            "object": {
                                "placeType": "EATERY",
                                "isGeo": false,
                                "locationId": 13294520,
                                "latitude": 25.09727,
                                "longitude": 55.175304,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 168,
                                    "popIndexTotal": 8690
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 5,
                                    "count": 696,
                                    "ratingCounts": [
                                        8,
                                        4,
                                        12,
                                        69,
                                        603
                                    ]
                                },
                                "detail": {
                                    "__typename": "Restaurant"
                                },
                                "name": "Local - TRYP by Wyndham",
                                "geoName": "Dubai",
                                "locationDescription": "Home to good mood food and a great atmosphere, Local is the perfect spot for catchups with loved ones. Bring the whole family, including your four-legged friend, & enjoy our terrace while treating yourself to a cocktail or cold beverage. Whether you're looking for a sports bar to watch a big game or in the mood for amazing food and drinks, we’re the place to be in Dubai. Catch your favourite Premier League, Champions League & 6 Nations games live on our big screens, plus enjoy the best daily shisha and happy hour specials in Barsha Heights/Tecom. If you're looking for some live music, we've got that too! Plus, our weekly favourite – Ladies Night on Wednesdays. Local has fun entertainment for everyone so be sure to come by & check us out.",
                                "localizedStreetAddress": {
                                    "street1": "Al Saef 1 Street",
                                    "fullAddress": "Al Saef 1 Street TRYP By Wyndham, Barsha Heights, Dubai 0000 United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Restaurant_Review-g295424-d13294520-Reviews-Local_TRYP_by_Wyndham-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Al Barsha Heights (Tecom)"
                                    },
                                    {
                                        "name": "Al Barsha"
                                    }
                                ],
                                "cuisines": [
                                    {
                                        "localizedName": "Mediterranean"
                                    },
                                    {
                                        "localizedName": "Bar"
                                    }
                                ],
                                "price": [
                                    {
                                        "localizedName": "$$"
                                    }
                                ],
                                "locationV2": {
                                    "tags": {
                                        "tags": []
                                    },
                                    "rentalDetails": null,
                                    "details": null,
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2023,
                                        "awardType": "COE"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    }
                                },
                                "thumbnail": {
                                    "id": 480980407,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/ab/2d/b7/grilled-meat.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/ab/2d/b7/grilled-meat.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/ab/2d/b7/grilled-meat.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/ab/2d/b7/grilled-meat.jpg"
                                        },
                                        {
                                            "height": 168,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/ab/2d/b7/grilled-meat.jpg"
                                        },
                                        {
                                            "height": 370,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/ab/2d/b7/grilled-meat.jpg"
                                        },
                                        {
                                            "height": 689,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/ab/2d/b7/grilled-meat.jpg"
                                        },
                                        {
                                            "height": 861,
                                            "width": 1280,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1c/ab/2d/b7/grilled-meat.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 294313314,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/11/8a/dd/62/getlstd-property-photo.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/11/8a/dd/62/getlstd-property-photo.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/11/8a/dd/62/getlstd-property-photo.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/11/8a/dd/62/getlstd-property-photo.jpg"
                                            },
                                            {
                                                "height": 154,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/11/8a/dd/62/getlstd-property-photo.jpg"
                                            },
                                            {
                                                "height": 338,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/11/8a/dd/62/getlstd-property-photo.jpg"
                                            },
                                            {
                                                "height": 630,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/11/8a/dd/62/getlstd-property-photo.jpg"
                                            },
                                            {
                                                "height": 1099,
                                                "width": 1786,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/11/8a/dd/62/getlstd-property-photo.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 480980407,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/ab/2d/b7/grilled-meat.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/ab/2d/b7/grilled-meat.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/ab/2d/b7/grilled-meat.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/ab/2d/b7/grilled-meat.jpg"
                                            },
                                            {
                                                "height": 168,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/ab/2d/b7/grilled-meat.jpg"
                                            },
                                            {
                                                "height": 370,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/ab/2d/b7/grilled-meat.jpg"
                                            },
                                            {
                                                "height": 689,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/ab/2d/b7/grilled-meat.jpg"
                                            },
                                            {
                                                "height": 861,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1c/ab/2d/b7/grilled-meat.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 653774167,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/26/f7/cd/57/steak.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/26/f7/cd/57/steak.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/26/f7/cd/57/steak.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/26/f7/cd/57/steak.jpg"
                                            },
                                            {
                                                "height": 136,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/26/f7/cd/57/steak.jpg"
                                            },
                                            {
                                                "height": 299,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/26/f7/cd/57/steak.jpg"
                                            },
                                            {
                                                "height": 557,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/26/f7/cd/57/steak.jpg"
                                            },
                                            {
                                                "height": 696,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/26/f7/cd/57/steak.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 673459945,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/28/24/2e/e9/venue.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/28/24/2e/e9/venue.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/28/24/2e/e9/venue.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/28/24/2e/e9/venue.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/28/24/2e/e9/venue.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/28/24/2e/e9/venue.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/28/24/2e/e9/venue.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/28/24/2e/e9/venue.jpg"
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },
                {
                    "id": 703224900,
                    "object": {
                        "comments": [],
                        "communityContent": [],
                        "recommendedProduct": null,
                        "date": null,
                        "narrativeDescription": {
                            "text": "{{6a0acdf7-cbf2-42c3-bddc-d4d172522ba2}} in Dubai is a vibrant hub of creativity, innovation, and cultural exploration. This eclectic space brings together entrepreneurs, designers, artisans, and artists, offering a unique blend of art galleries, cinema screenings, cozy coffee shops, and trendy fashion boutiques. The area is traffic-free, providing a peaceful atmosphere for you and your partner to wander around and discover hidden gems. With a mix of independent businesses, including fitness centers and food outlets, there is something for everyone to enjoy. Dive into the art scene with galleries showcasing work from around the world, and don't miss the exciting events and farmer's market on Sundays.",
                            "plainText": "Alserkal Avenue in Dubai is a vibrant hub of creativity, innovation, and cultural exploration. This eclectic space brings together entrepreneurs, designers, artisans, and artists, offering a unique blend of art galleries, cinema screenings, cozy coffee shops, and trendy fashion boutiques. The area is traffic-free, providing a peaceful atmosphere for you and your partner to wander around and discover hidden gems. With a mix of independent businesses, including fitness centers and food outlets, there is something for everyone to enjoy. Dive into the art scene with galleries showcasing work from around the world, and don't miss the exciting events and farmer's market on Sundays.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "6a0acdf7-cbf2-42c3-bddc-d4d172522ba2",
                                    "value": "Alserkal Avenue"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 6545107,
                            "object": {
                                "placeType": "ATTRACTION",
                                "isGeo": false,
                                "locationId": 6545107,
                                "latitude": 25.141996,
                                "longitude": 55.22557,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 104,
                                    "popIndexTotal": 5171
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 7,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 22,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 4.5,
                                    "count": 104,
                                    "ratingCounts": [
                                        0,
                                        3,
                                        7,
                                        39,
                                        55
                                    ]
                                },
                                "cuisines": [],
                                "price": [],
                                "detail": {
                                    "__typename": "Attraction"
                                },
                                "name": "Alserkal Avenue",
                                "geoName": "Dubai",
                                "locationDescription": "Alserkal Avenue is Dubai's leading cultural district, offering a blend of contemporary art galleries, boutique food and beverage concepts, and innovative homegrown retail businesses.",
                                "localizedStreetAddress": {
                                    "street1": "Alserkal Avenue, 17th St - Al Quoz Industrial Area 1",
                                    "fullAddress": "Alserkal Avenue, 17th St - Al Quoz Industrial Area 1, Dubai 390099 United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Attraction_Review-g295424-d6545107-Reviews-Alserkal_Avenue-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Al Quoz Industrial Area 1"
                                    },
                                    {
                                        "name": "Al Quoz"
                                    },
                                    {
                                        "name": "Al Quoz Industrial Area"
                                    }
                                ],
                                "thumbnail": {
                                    "id": 450636008,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/dc/28/e8/gallery-isabelle-van.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/1a/dc/28/e8/gallery-isabelle-van.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/1a/dc/28/e8/gallery-isabelle-van.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/1a/dc/28/e8/gallery-isabelle-van.jpg"
                                        },
                                        {
                                            "height": 167,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/1a/dc/28/e8/gallery-isabelle-van.jpg"
                                        },
                                        {
                                            "height": 367,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/1a/dc/28/e8/gallery-isabelle-van.jpg"
                                        },
                                        {
                                            "height": 683,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/1a/dc/28/e8/gallery-isabelle-van.jpg"
                                        },
                                        {
                                            "height": 853,
                                            "width": 1280,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1a/dc/28/e8/gallery-isabelle-van.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 176329278,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0a/82/92/3e/film-screening-in-the.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/0a/82/92/3e/film-screening-in-the.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/0a/82/92/3e/film-screening-in-the.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/0a/82/92/3e/film-screening-in-the.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/0a/82/92/3e/film-screening-in-the.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/0a/82/92/3e/film-screening-in-the.jpg"
                                            },
                                            {
                                                "height": 2362,
                                                "width": 3543,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/0a/82/92/3e/film-screening-in-the.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 450635965,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/dc/28/bd/alserkal-avenue.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1a/dc/28/bd/alserkal-avenue.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1a/dc/28/bd/alserkal-avenue.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1a/dc/28/bd/alserkal-avenue.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1a/dc/28/bd/alserkal-avenue.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1a/dc/28/bd/alserkal-avenue.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1a/dc/28/bd/alserkal-avenue.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1a/dc/28/bd/alserkal-avenue.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 121044193,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/07/36/fc/e1/alserkal-avenue-arts.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/07/36/fc/e1/alserkal-avenue-arts.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/07/36/fc/e1/alserkal-avenue-arts.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 154,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/07/36/fc/e1/alserkal-avenue-arts.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 338,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/07/36/fc/e1/alserkal-avenue-arts.jpg"
                                            },
                                            {
                                                "height": 1365,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/07/36/fc/e1/alserkal-avenue-arts.jpg"
                                            },
                                            {
                                                "height": 1500,
                                                "width": 1125,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/07/36/fc/e1/alserkal-avenue-arts.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 450636549,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/dc/2b/05/alserkal-avenue.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1a/dc/2b/05/alserkal-avenue.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1a/dc/2b/05/alserkal-avenue.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1a/dc/2b/05/alserkal-avenue.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1a/dc/2b/05/alserkal-avenue.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1a/dc/2b/05/alserkal-avenue.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1a/dc/2b/05/alserkal-avenue.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1a/dc/2b/05/alserkal-avenue.jpg"
                                            }
                                        ]
                                    }
                                ],
                                "locationV2": {
                                    "bestAwardForActiveYearV2": null,
                                    "rentalDetails": null,
                                    "details": {
                                        "__typename": "LocationSelection_AttractionDetails"
                                    },
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    },
                                    "tags": {
                                        "tags": [
                                            {
                                                "tagId": 11036,
                                                "tag": {
                                                    "localizedName": "Art Galleries"
                                                }
                                            },
                                            {
                                                "tagId": 11061,
                                                "tag": {
                                                    "localizedName": "Art Museums"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "id": 703224901,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "CERTIFICATE_OF_EXCELLENCE",
                                "type": "TravelersChoiceAwardData"
                            },
                            {
                                "__typename": "Trips_HighlyRecommendedData",
                                "type": "HighlyRecommendedData",
                                "percentRecommended": 95
                            }
                        ],
                        "date": null,
                        "recommendedProduct": {
                            "activityId": 15107593,
                            "pricingInfo": {
                                "fromPrice": 361.92,
                                "isTieredPricing": false,
                                "maxTravelersPerUnit": 0,
                                "pricingType": "TRAVELLER_BY_AGE_BAND"
                            },
                            "title": {
                                "text": "Dinner at Dubai Marina"
                            },
                            "route": {
                                "url": "/AttractionProductReview-g295424-d15107593-Dinner_at_Dubai_Marina-Dubai_Emirate_of_Dubai.html"
                            }
                        },
                        "narrativeDescription": {
                            "text": "{{4c6ebda4-7066-4ed9-b27d-65243908c299}} is a beautiful area with stunning buildings and boats, offering wonderful views of downtown and numerous cruise ships and yachts. The Marina Walk boasts smart cafes, pop-up craft markets, and a variety of food and beverage outlets, making it a great place to spend a day. You can easily and affordably reach the Marina via the Metro, adding to the convenience of exploring this vibrant area. With your interest in must-see attractions, great food, and hidden gems, {{4c6ebda4-7066-4ed9-b27d-65243908c299}} is sure to captivate you and your partner during your 4-day visit to Dubai.",
                            "plainText": "Dubai Marina is a beautiful area with stunning buildings and boats, offering wonderful views of downtown and numerous cruise ships and yachts. The Marina Walk boasts smart cafes, pop-up craft markets, and a variety of food and beverage outlets, making it a great place to spend a day. You can easily and affordably reach the Marina via the Metro, adding to the convenience of exploring this vibrant area. With your interest in must-see attractions, great food, and hidden gems, Dubai Marina is sure to captivate you and your partner during your 4-day visit to Dubai.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "4c6ebda4-7066-4ed9-b27d-65243908c299",
                                    "value": "Dubai Marina"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 12645264,
                            "object": {
                                "placeType": "ATTRACTION",
                                "isGeo": false,
                                "locationId": 12645264,
                                "latitude": 25.080654,
                                "longitude": 55.140137,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 31,
                                    "popIndexTotal": 5171
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": null,
                                "reviewSummary": {
                                    "rating": 4.5,
                                    "count": 1650,
                                    "ratingCounts": [
                                        11,
                                        8,
                                        79,
                                        430,
                                        1122
                                    ]
                                },
                                "cuisines": [],
                                "price": [],
                                "detail": {
                                    "__typename": "Attraction"
                                },
                                "name": "Dubai Marina",
                                "geoName": "Dubai",
                                "locationDescription": "This luxurious waterfront district adjacent to the Palm Jumeirah is lined with glittering skyscrapers, exclusive residences, and breezy boulevards that are entirely man-made.",
                                "localizedStreetAddress": {
                                    "street1": "Al Marsa St",
                                    "fullAddress": "Al Marsa St, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Attraction_Review-g295424-d12645264-Reviews-Dubai_Marina-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "The Marina"
                                    }
                                ],
                                "thumbnail": {
                                    "id": 385298928,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/16/f7/31/f0/dubai-marina.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/16/f7/31/f0/dubai-marina.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/16/f7/31/f0/dubai-marina.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/16/f7/31/f0/dubai-marina.jpg"
                                        },
                                        {
                                            "height": 188,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/16/f7/31/f0/dubai-marina.jpg"
                                        },
                                        {
                                            "height": 413,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/16/f7/31/f0/dubai-marina.jpg"
                                        },
                                        {
                                            "height": 768,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/16/f7/31/f0/dubai-marina.jpg"
                                        },
                                        {
                                            "height": 960,
                                            "width": 1280,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/16/f7/31/f0/dubai-marina.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 750874843,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/c1/70/db/caption.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/c1/70/db/caption.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/c1/70/db/caption.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/c1/70/db/caption.jpg"
                                            },
                                            {
                                                "height": 188,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/c1/70/db/caption.jpg"
                                            },
                                            {
                                                "height": 413,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/c1/70/db/caption.jpg"
                                            },
                                            {
                                                "height": 768,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/c1/70/db/caption.jpg"
                                            },
                                            {
                                                "height": 960,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/c1/70/db/caption.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 750874842,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/c1/70/da/caption.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/c1/70/da/caption.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/c1/70/da/caption.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/c1/70/da/caption.jpg"
                                            },
                                            {
                                                "height": 188,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/c1/70/da/caption.jpg"
                                            },
                                            {
                                                "height": 413,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/c1/70/da/caption.jpg"
                                            },
                                            {
                                                "height": 768,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/c1/70/da/caption.jpg"
                                            },
                                            {
                                                "height": 960,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/c1/70/da/caption.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 750874841,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/c1/70/d9/caption.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/c1/70/d9/caption.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/c1/70/d9/caption.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 154,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/c1/70/d9/caption.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/c1/70/d9/caption.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 338,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/c1/70/d9/caption.jpg"
                                            },
                                            {
                                                "height": 733,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/2c/c1/70/d9/caption.jpg"
                                            },
                                            {
                                                "height": 1280,
                                                "width": 960,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/c1/70/d9/caption.jpg"
                                            },
                                            {
                                                "height": 1365,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/c1/70/d9/caption.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 750874840,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/c1/70/d8/caption.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/c1/70/d8/caption.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/c1/70/d8/caption.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 154,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/c1/70/d8/caption.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/c1/70/d8/caption.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 338,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/c1/70/d8/caption.jpg"
                                            },
                                            {
                                                "height": 733,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/2c/c1/70/d8/caption.jpg"
                                            },
                                            {
                                                "height": 1280,
                                                "width": 960,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/c1/70/d8/caption.jpg"
                                            },
                                            {
                                                "height": 1365,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/c1/70/d8/caption.jpg"
                                            }
                                        ]
                                    }
                                ],
                                "locationV2": {
                                    "rentalDetails": null,
                                    "details": {
                                        "__typename": "LocationSelection_AttractionDetails"
                                    },
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2024,
                                        "awardType": "COE"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    },
                                    "tags": {
                                        "tags": [
                                            {
                                                "tagId": 11088,
                                                "tag": {
                                                    "localizedName": "Marinas"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "id": 703224902,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelerRankingData",
                                "type": "TravelerRankingData",
                                "rank": 6,
                                "total": 8689
                            },
                            {
                                "__typename": "Trips_HighlyRecommendedData",
                                "type": "HighlyRecommendedData",
                                "percentRecommended": 100
                            }
                        ],
                        "recommendedProduct": null,
                        "date": null,
                        "narrativeDescription": {
                            "text": "{{c7b76cb3-bdcf-4b8c-a63e-b4618adb107e}} in Dubai offers a delightful dining experience with a focus on high-quality ingredients and exceptional service. Past visitors have praised the knowledgeable and friendly staff, such as Sher, Vaishun, and Cyrle, who go above and beyond to make your meal special. The menu features a variety of dishes, including delicious desserts like the Hello Pistachio. While some reviews note inconsistent service, standout servers like Neethu, David, and Rita ensure a memorable dining experience. If you appreciate good food and welcoming staff, Jones The Grocer is a must-visit during your stay in Dubai.",
                            "plainText": "Jones The Grocer - Delta Jbr in Dubai offers a delightful dining experience with a focus on high-quality ingredients and exceptional service. Past visitors have praised the knowledgeable and friendly staff, such as Sher, Vaishun, and Cyrle, who go above and beyond to make your meal special. The menu features a variety of dishes, including delicious desserts like the Hello Pistachio. While some reviews note inconsistent service, standout servers like Neethu, David, and Rita ensure a memorable dining experience. If you appreciate good food and welcoming staff, Jones The Grocer is a must-visit during your stay in Dubai.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "c7b76cb3-bdcf-4b8c-a63e-b4618adb107e",
                                    "value": "Jones The Grocer - Delta Jbr"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 25152460,
                            "object": {
                                "placeType": "EATERY",
                                "isGeo": false,
                                "locationId": 25152460,
                                "latitude": 25.077793,
                                "longitude": 55.136078,
                                "neighborhoods": [],
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 6,
                                    "popIndexTotal": 8690
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 6,
                                                        "minutes": 30
                                                    },
                                                    "closingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 5,
                                    "count": 889,
                                    "ratingCounts": [
                                        1,
                                        0,
                                        3,
                                        18,
                                        867
                                    ]
                                },
                                "detail": {
                                    "__typename": "Restaurant"
                                },
                                "name": "Jones The Grocer - Delta Jbr",
                                "geoName": "Dubai",
                                "locationDescription": "Upscale market with gourmet groceries & a cafe serving global food with an Australian twist. Relaxed yet vibrant, our all-day dining is open seven days a week serving breakfast, lunch, and dinner to both hotel guests and the JBR community. Just a five-minute walk from the JBR beach promenade, Bluewaters Island and Dubai Marina, the store has indoor and outdoor seating, with a pet-friendly shaded terrace. If you fancy shopping, the venue also includes its Jones the Grocer’s signature artisan cheese room, a charcuterie, a bakery, patisserie, deli, hand-selected groceries and a show kitchen.",
                                "localizedStreetAddress": {
                                    "street1": "JBR Bahar 7",
                                    "fullAddress": "JBR Bahar 7 Podium Level, Delta Hotels by Marriott, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Restaurant_Review-g295424-d25152460-Reviews-Jones_The_Grocer_Delta_Jbr-Dubai_Emirate_of_Dubai.html"
                                },
                                "cuisines": [
                                    {
                                        "localizedName": "Australian"
                                    }
                                ],
                                "price": [
                                    {
                                        "localizedName": "$$$$"
                                    }
                                ],
                                "locationV2": {
                                    "bestAwardForActiveYearV2": null,
                                    "tags": {
                                        "tags": []
                                    },
                                    "rentalDetails": null,
                                    "details": null,
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    }
                                },
                                "thumbnail": {
                                    "id": 660412301,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/27/5d/17/8d/jones-the-grocer.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/27/5d/17/8d/jones-the-grocer.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/27/5d/17/8d/jones-the-grocer.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/27/5d/17/8d/jones-the-grocer.jpg"
                                        },
                                        {
                                            "height": 167,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/27/5d/17/8d/jones-the-grocer.jpg"
                                        },
                                        {
                                            "height": 367,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/27/5d/17/8d/jones-the-grocer.jpg"
                                        },
                                        {
                                            "height": 683,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/27/5d/17/8d/jones-the-grocer.jpg"
                                        },
                                        {
                                            "height": 853,
                                            "width": 1280,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/27/5d/17/8d/jones-the-grocer.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 660412301,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/27/5d/17/8d/jones-the-grocer.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/27/5d/17/8d/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/27/5d/17/8d/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/27/5d/17/8d/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/27/5d/17/8d/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/27/5d/17/8d/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/27/5d/17/8d/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/27/5d/17/8d/jones-the-grocer.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 660412468,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/27/5d/18/34/jones-the-grocer.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/27/5d/18/34/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/27/5d/18/34/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/27/5d/18/34/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/27/5d/18/34/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/27/5d/18/34/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/27/5d/18/34/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/27/5d/18/34/jones-the-grocer.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 660412428,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/27/5d/18/0c/jones-the-grocer.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/27/5d/18/0c/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/27/5d/18/0c/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/27/5d/18/0c/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/27/5d/18/0c/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/27/5d/18/0c/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/27/5d/18/0c/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/27/5d/18/0c/jones-the-grocer.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 660412416,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/27/5d/18/00/jones-the-grocer.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/27/5d/18/00/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/27/5d/18/00/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/27/5d/18/00/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/27/5d/18/00/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/27/5d/18/00/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/27/5d/18/00/jones-the-grocer.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/27/5d/18/00/jones-the-grocer.jpg"
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },
                {
                    "id": 703224903,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "BEST_OF_THE_BEST",
                                "type": "TravelersChoiceAwardData"
                            },
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "CERTIFICATE_OF_EXCELLENCE",
                                "type": "TravelersChoiceAwardData"
                            }
                        ],
                        "date": null,
                        "recommendedProduct": {
                            "activityId": 23836815,
                            "pricingInfo": {
                                "fromPrice": 121.91,
                                "isTieredPricing": false,
                                "maxTravelersPerUnit": 0,
                                "pricingType": "TRAVELLER_BY_AGE_BAND"
                            },
                            "title": {
                                "text": "Dubai Miracle Garden Entry Pass"
                            },
                            "route": {
                                "url": "/AttractionProductReview-g295424-d23836815-Dubai_Miracle_Garden_Entry_Pass-Dubai_Emirate_of_Dubai.html"
                            }
                        },
                        "narrativeDescription": {
                            "text": "Located in Dubai, the {{4236cdee-7a2e-4bd7-95da-5a2cc6cd42e8}} is a captivating attraction that offers a magical experience with its stunning floral displays and theme-based exhibits. Plan to spend around 2-3 hours exploring the garden to fully appreciate its beauty and serenity, making it a great addition to your itinerary. The entrance fee is worth it, considering the vibrant colors, characters from fairy tales, and enchanting floral arrangements. It's advisable to visit during less crowded times for a more enjoyable experience and better photo opportunities. This unique garden will surely appeal to your interests in must-see attractions and hidden gems, providing a memorable experience for you and your partner.",
                            "plainText": "Located in Dubai, the Dubai Miracle Garden is a captivating attraction that offers a magical experience with its stunning floral displays and theme-based exhibits. Plan to spend around 2-3 hours exploring the garden to fully appreciate its beauty and serenity, making it a great addition to your itinerary. The entrance fee is worth it, considering the vibrant colors, characters from fairy tales, and enchanting floral arrangements. It's advisable to visit during less crowded times for a more enjoyable experience and better photo opportunities. This unique garden will surely appeal to your interests in must-see attractions and hidden gems, providing a memorable experience for you and your partner.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "4236cdee-7a2e-4bd7-95da-5a2cc6cd42e8",
                                    "value": "Dubai Miracle Garden"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 3916661,
                            "object": {
                                "placeType": "ATTRACTION",
                                "isGeo": false,
                                "locationId": 3916661,
                                "latitude": 25.06001,
                                "longitude": 55.244465,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 41,
                                    "popIndexTotal": 5171
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 9,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 4.5,
                                    "count": 8097,
                                    "ratingCounts": [
                                        115,
                                        171,
                                        683,
                                        1970,
                                        4936
                                    ]
                                },
                                "cuisines": [],
                                "price": [],
                                "detail": {
                                    "__typename": "Attraction"
                                },
                                "name": "Dubai Miracle Garden",
                                "geoName": "Dubai",
                                "locationDescription": "Miracle Garden is one of a kind in the region and in the world for such a unique display and extravagant outdoor recreational destination. Miracle Garden in its first phase is providing state-of-the-art services and facilities including open parking, VIP parking, sitting areas, prayer room, toilet blocks, ablution facility, security room, first aid room, carts for handicapped visitors, retails and commercial kiosk and all other related services available to facilitate visitors.",
                                "localizedStreetAddress": {
                                    "street1": "Al Barsha South Third",
                                    "fullAddress": "Al Barsha South Third Dubailand, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Attraction_Review-g295424-d3916661-Reviews-Dubai_Miracle_Garden-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Al Barsha South"
                                    },
                                    {
                                        "name": "Al Barsha"
                                    }
                                ],
                                "thumbnail": {
                                    "id": 68772938,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/04/19/64/4a/miracle-garden.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/04/19/64/4a/miracle-garden.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/04/19/64/4a/miracle-garden.jpg"
                                        },
                                        {
                                            "height": 108,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/04/19/64/4a/miracle-garden.jpg"
                                        },
                                        {
                                            "height": 239,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/04/19/64/4a/miracle-garden.jpg"
                                        },
                                        {
                                            "height": 870,
                                            "width": 2000,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-o/04/19/64/4a/miracle-garden.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 479752535,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/98/71/57/season-6.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/98/71/57/season-6.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/98/71/57/season-6.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/98/71/57/season-6.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/98/71/57/season-6.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/98/71/57/season-6.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/1c/98/71/57/season-6.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/98/71/57/season-6.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 477544306,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/76/bf/72/dubai-miracle-garden.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/76/bf/72/dubai-miracle-garden.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/76/bf/72/dubai-miracle-garden.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/76/bf/72/dubai-miracle-garden.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/76/bf/72/dubai-miracle-garden.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/76/bf/72/dubai-miracle-garden.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/76/bf/72/dubai-miracle-garden.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1c/76/bf/72/dubai-miracle-garden.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 479752534,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/98/71/56/season-6.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/98/71/56/season-6.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/98/71/56/season-6.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/98/71/56/season-6.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/98/71/56/season-6.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/98/71/56/season-6.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/1c/98/71/56/season-6.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/98/71/56/season-6.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 479751445,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/98/6d/15/season-6-the-tallest.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/98/6d/15/season-6-the-tallest.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/98/6d/15/season-6-the-tallest.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/98/6d/15/season-6-the-tallest.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/98/6d/15/season-6-the-tallest.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/98/6d/15/season-6-the-tallest.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/1c/98/6d/15/season-6-the-tallest.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/98/6d/15/season-6-the-tallest.jpg"
                                            }
                                        ]
                                    }
                                ],
                                "locationV2": {
                                    "rentalDetails": null,
                                    "details": {
                                        "__typename": "LocationSelection_AttractionDetails"
                                    },
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2024,
                                        "awardType": "BOTB"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    },
                                    "tags": {
                                        "tags": [
                                            {
                                                "tagId": 11082,
                                                "tag": {
                                                    "localizedName": "Gardens"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "id": 703225060,
                    "object": {
                        "comments": [],
                        "communityContent": [],
                        "date": null,
                        "recommendedProduct": {
                            "activityId": 26693738,
                            "pricingInfo": {
                                "fromPrice": 60.92,
                                "isTieredPricing": true,
                                "maxTravelersPerUnit": 0,
                                "pricingType": "TRAVELLER_BY_AGE_BAND"
                            },
                            "title": {
                                "text": "Dubai Frame Ticket"
                            },
                            "route": {
                                "url": "/AttractionProductReview-g295424-d26693738-Dubai_Frame_Ticket-Dubai_Emirate_of_Dubai.html"
                            }
                        },
                        "narrativeDescription": {
                            "text": "{{9bb8c7e8-38b9-489f-a347-72f8958517a0}}, the largest frame in the world, is a must-visit attraction offering breathtaking views of both old and new Dubai. To enhance your experience, purchase advance tickets online to skip long lines at the ticket counters and avoid crowds, especially when tour buses arrive. Make sure to visit in the evening before sunset to witness the city transform from day to night, creating a mesmerizing sight. You can also enjoy the thrilling translucent glass floor at the top, adding a fun element to your visit. With its fabulous architecture and great views, {{9bb8c7e8-38b9-489f-a347-72f8958517a0}} is a hidden gem worth exploring during your 4-day trip with your partner in Dubai.",
                            "plainText": "Dubai Frame, the largest frame in the world, is a must-visit attraction offering breathtaking views of both old and new Dubai. To enhance your experience, purchase advance tickets online to skip long lines at the ticket counters and avoid crowds, especially when tour buses arrive. Make sure to visit in the evening before sunset to witness the city transform from day to night, creating a mesmerizing sight. You can also enjoy the thrilling translucent glass floor at the top, adding a fun element to your visit. With its fabulous architecture and great views, Dubai Frame is a hidden gem worth exploring during your 4-day trip with your partner in Dubai.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "9bb8c7e8-38b9-489f-a347-72f8958517a0",
                                    "value": "Dubai Frame"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 13320787,
                            "object": {
                                "placeType": "ATTRACTION",
                                "isGeo": false,
                                "locationId": 13320787,
                                "latitude": 25.235575,
                                "longitude": 55.30036,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 23,
                                    "popIndexTotal": 5171
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 8,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 21,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 4.5,
                                    "count": 3814,
                                    "ratingCounts": [
                                        60,
                                        65,
                                        300,
                                        972,
                                        2416
                                    ]
                                },
                                "cuisines": [],
                                "price": [],
                                "detail": {
                                    "__typename": "Attraction"
                                },
                                "name": "Dubai Frame",
                                "geoName": "Dubai",
                                "locationDescription": "The UAE’s latest cultural landmark, Dubai Frame is an iconic structure that ‘frames’ impressive views of Old and New Dubai, while serving as a metaphorical bridge connecting the emirate’s rich past with its magnificent present. Dubai Frame celebrates the story of Dubai from its early establishment to its ambitious plans for future development. Launched in January 2018, the project comprises a 150-metre-high, 95-meter-wide structure being built to resemble a huge picture frame, through which landmarks representing modern Dubai such as Emirates Towers and Burj Khalifa can be seen on one side, while from the other side, visitors can view older parts of the city such as Deira and Karama. Exterior design of Dubai Frame was inspired from the logo of EXPO2020 and it is world's largest picture frame by Guinness World Records. According to Dubai Frame general policy, guests are requested to wear respectful clothing: shoulders and knees to be covered.",
                                "localizedStreetAddress": {
                                    "street1": "Sheikh Rashid Road",
                                    "fullAddress": "Sheikh Rashid Road Gate 4, Zabeel Park, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Attraction_Review-g295424-d13320787-Reviews-Dubai_Frame-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Al Kefaf"
                                    },
                                    {
                                        "name": "Bur Dubai"
                                    }
                                ],
                                "thumbnail": {
                                    "id": 302485101,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/12/07/8e/6d/dubai-frame-main.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/12/07/8e/6d/dubai-frame-main.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/12/07/8e/6d/dubai-frame-main.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/12/07/8e/6d/dubai-frame-main.jpg"
                                        },
                                        {
                                            "height": 167,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/12/07/8e/6d/dubai-frame-main.jpg"
                                        },
                                        {
                                            "height": 367,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/12/07/8e/6d/dubai-frame-main.jpg"
                                        },
                                        {
                                            "height": 640,
                                            "width": 960,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-o/12/07/8e/6d/dubai-frame-main.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 478425442,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/84/31/62/dubai-frame.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/84/31/62/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/84/31/62/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/84/31/62/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 162,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/84/31/62/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 357,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/84/31/62/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 665,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/84/31/62/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 831,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1c/84/31/62/dubai-frame.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 478425300,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/84/30/d4/dubai-frame.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/1c/84/30/d4/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/1c/84/30/d4/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/1c/84/30/d4/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 187,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/1c/84/30/d4/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 412,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/1c/84/30/d4/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 767,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/1c/84/30/d4/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 959,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1c/84/30/d4/dubai-frame.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 302485101,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/12/07/8e/6d/dubai-frame-main.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/12/07/8e/6d/dubai-frame-main.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/12/07/8e/6d/dubai-frame-main.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/12/07/8e/6d/dubai-frame-main.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/12/07/8e/6d/dubai-frame-main.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/12/07/8e/6d/dubai-frame-main.jpg"
                                            },
                                            {
                                                "height": 640,
                                                "width": 960,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/12/07/8e/6d/dubai-frame-main.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 300218365,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/11/e4/f7/fd/dubai-frame.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/11/e4/f7/fd/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/11/e4/f7/fd/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/11/e4/f7/fd/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/11/e4/f7/fd/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 366,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/11/e4/f7/fd/dubai-frame.jpg"
                                            },
                                            {
                                                "height": 627,
                                                "width": 940,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/11/e4/f7/fd/dubai-frame.jpg"
                                            }
                                        ]
                                    }
                                ],
                                "locationV2": {
                                    "bestAwardForActiveYearV2": null,
                                    "rentalDetails": null,
                                    "details": {
                                        "__typename": "LocationSelection_AttractionDetails"
                                    },
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    },
                                    "tags": {
                                        "tags": [
                                            {
                                                "tagId": 11038,
                                                "tag": {
                                                    "localizedName": "Architectural Buildings"
                                                }
                                            },
                                            {
                                                "tagId": 11068,
                                                "tag": {
                                                    "localizedName": "Observation Decks & Towers"
                                                }
                                            },
                                            {
                                                "tagId": 11160,
                                                "tag": {
                                                    "localizedName": "Points of Interest & Landmarks"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "id": 703225061,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelerRankingData",
                                "type": "TravelerRankingData",
                                "rank": 8,
                                "total": 5156
                            },
                            {
                                "__typename": "Trips_HighlyRecommendedData",
                                "type": "HighlyRecommendedData",
                                "percentRecommended": 100
                            }
                        ],
                        "date": null,
                        "recommendedProduct": {
                            "activityId": 27979436,
                            "pricingInfo": {
                                "fromPrice": 113.34,
                                "isTieredPricing": false,
                                "maxTravelersPerUnit": 0,
                                "pricingType": "TRAVELLER_BY_AGE_BAND"
                            },
                            "title": {
                                "text": "Dubai Crocodile Park Entry Tickets"
                            },
                            "route": {
                                "url": "/AttractionProductReview-g295424-d27979436-Dubai_Crocodile_Park_Entry_Tickets-Dubai_Emirate_of_Dubai.html"
                            }
                        },
                        "narrativeDescription": {
                            "text": "As you explore Dubai, the {{36d347bf-fcde-4258-be64-0d01dd74df18}} offers a unique and educational experience for you and your partner. The well-organized park is not too crowded, making it a great place to visit. Knowledgeable guides interact with visitors and provide interesting facts about crocodiles. The indoor museum is informative, and the park features a natural habitat for various crocodile species. The staff is friendly and the ambiance is welcoming. While the cafe could use improvement, the park is worth a visit, especially during feeding time. It's a hidden gem that aligns with your interests in must-see attractions, great food, and unique experiences.",
                            "plainText": "As you explore Dubai, the Dubai Crocodile Park offers a unique and educational experience for you and your partner. The well-organized park is not too crowded, making it a great place to visit. Knowledgeable guides interact with visitors and provide interesting facts about crocodiles. The indoor museum is informative, and the park features a natural habitat for various crocodile species. The staff is friendly and the ambiance is welcoming. While the cafe could use improvement, the park is worth a visit, especially during feeding time. It's a hidden gem that aligns with your interests in must-see attractions, great food, and unique experiences.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "36d347bf-fcde-4258-be64-0d01dd74df18",
                                    "value": "Dubai Crocodile Park"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 25461706,
                            "object": {
                                "placeType": "ATTRACTION",
                                "isGeo": false,
                                "locationId": 25461706,
                                "latitude": 25.202711,
                                "longitude": 55.441082,
                                "neighborhoods": [],
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 8,
                                    "popIndexTotal": 5171
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 20,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 20,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 20,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 20,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 20,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 20,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 20,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 5,
                                    "count": 448,
                                    "ratingCounts": [
                                        0,
                                        1,
                                        2,
                                        14,
                                        432
                                    ]
                                },
                                "cuisines": [],
                                "price": [],
                                "detail": {
                                    "__typename": "Attraction"
                                },
                                "name": "Dubai Crocodile Park",
                                "geoName": "Dubai",
                                "locationDescription": "Explore The Fascinating World Of Crocodiles. Home to 250 Nile Crocodiles, Dubai Crocodile Park offers a family friendly experience. The park includes a Natural History Museum, an African lake themed aquarium, a Savanna inspired landscaped area, a curio shop and multiple dining outlets.",
                                "localizedStreetAddress": {
                                    "street1": "Tripoli Street",
                                    "fullAddress": "Tripoli Street Next to Mushrif Park, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Attraction_Review-g295424-d25461706-Reviews-Dubai_Crocodile_Park-Dubai_Emirate_of_Dubai.html"
                                },
                                "thumbnail": {
                                    "id": 700082524,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/29/ba/69/5c/a-unique-experience-designed.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/29/ba/69/5c/a-unique-experience-designed.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/29/ba/69/5c/a-unique-experience-designed.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/29/ba/69/5c/a-unique-experience-designed.jpg"
                                        },
                                        {
                                            "height": 164,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/29/ba/69/5c/a-unique-experience-designed.jpg"
                                        },
                                        {
                                            "height": 360,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/29/ba/69/5c/a-unique-experience-designed.jpg"
                                        },
                                        {
                                            "height": 670,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/29/ba/69/5c/a-unique-experience-designed.jpg"
                                        },
                                        {
                                            "height": 838,
                                            "width": 1280,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/29/ba/69/5c/a-unique-experience-designed.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 700082524,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/29/ba/69/5c/a-unique-experience-designed.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/29/ba/69/5c/a-unique-experience-designed.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/29/ba/69/5c/a-unique-experience-designed.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/29/ba/69/5c/a-unique-experience-designed.jpg"
                                            },
                                            {
                                                "height": 164,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/29/ba/69/5c/a-unique-experience-designed.jpg"
                                            },
                                            {
                                                "height": 360,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/29/ba/69/5c/a-unique-experience-designed.jpg"
                                            },
                                            {
                                                "height": 670,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/29/ba/69/5c/a-unique-experience-designed.jpg"
                                            },
                                            {
                                                "height": 838,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/29/ba/69/5c/a-unique-experience-designed.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 730482977,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/8a/49/21/crocodile-park.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2b/8a/49/21/crocodile-park.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2b/8a/49/21/crocodile-park.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2b/8a/49/21/crocodile-park.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2b/8a/49/21/crocodile-park.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2b/8a/49/21/crocodile-park.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2b/8a/49/21/crocodile-park.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2b/8a/49/21/crocodile-park.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 730482940,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/8a/48/fc/okavango-cafe.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2b/8a/48/fc/okavango-cafe.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2b/8a/48/fc/okavango-cafe.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2b/8a/48/fc/okavango-cafe.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2b/8a/48/fc/okavango-cafe.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2b/8a/48/fc/okavango-cafe.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2b/8a/48/fc/okavango-cafe.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2b/8a/48/fc/okavango-cafe.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 730482936,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/8a/48/f8/crocodile-museum.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2b/8a/48/f8/crocodile-museum.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2b/8a/48/f8/crocodile-museum.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2b/8a/48/f8/crocodile-museum.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2b/8a/48/f8/crocodile-museum.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2b/8a/48/f8/crocodile-museum.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2b/8a/48/f8/crocodile-museum.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2b/8a/48/f8/crocodile-museum.jpg"
                                            }
                                        ]
                                    }
                                ],
                                "locationV2": {
                                    "bestAwardForActiveYearV2": null,
                                    "rentalDetails": null,
                                    "details": {
                                        "__typename": "LocationSelection_AttractionDetails"
                                    },
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    },
                                    "tags": {
                                        "tags": [
                                            {
                                                "tagId": 11092,
                                                "tag": {
                                                    "localizedName": "Parks"
                                                }
                                            },
                                            {
                                                "tagId": 11131,
                                                "tag": {
                                                    "localizedName": "Aquariums"
                                                }
                                            },
                                            {
                                                "tagId": 11146,
                                                "tag": {
                                                    "localizedName": "Zoos"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "id": 703225062,
                    "object": {
                        "comments": [],
                        "communityContent": [],
                        "recommendedProduct": null,
                        "date": null,
                        "narrativeDescription": {
                            "text": "Located in Dubai, {{0e0401eb-dd05-478f-9ebc-1539833d7b07}} offers a great vibe and amazing Turkish cuisine, perfect for food and shisha enthusiasts like you. With incredibly friendly staff and top-notch service, this restaurant guarantees an enjoyable dining experience every time. From high-quality food with a wide variety on the menu to exceptional hospitality, it is considered the best Turkish restaurant in town. The delicious Turkish Lebanese cuisine, ambient music, and friendly staff create a special atmosphere that you will appreciate. If you are looking for a must-visit spot for food and shisha in Dubai, {{0e0401eb-dd05-478f-9ebc-1539833d7b07}} comes highly recommended.",
                            "plainText": "Located in Dubai, Bosporus Turkish Cuisine - Boulevard offers a great vibe and amazing Turkish cuisine, perfect for food and shisha enthusiasts like you. With incredibly friendly staff and top-notch service, this restaurant guarantees an enjoyable dining experience every time. From high-quality food with a wide variety on the menu to exceptional hospitality, it is considered the best Turkish restaurant in town. The delicious Turkish Lebanese cuisine, ambient music, and friendly staff create a special atmosphere that you will appreciate. If you are looking for a must-visit spot for food and shisha in Dubai, Bosporus Turkish Cuisine - Boulevard comes highly recommended.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "0e0401eb-dd05-478f-9ebc-1539833d7b07",
                                    "value": "Bosporus Turkish Cuisine - Boulevard"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 15185249,
                            "object": {
                                "placeType": "EATERY",
                                "isGeo": false,
                                "locationId": 15185249,
                                "latitude": 25.21609,
                                "longitude": 55.409237,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 1323,
                                    "popIndexTotal": 8690
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 10,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 4.5,
                                    "count": 77,
                                    "ratingCounts": [
                                        4,
                                        3,
                                        4,
                                        3,
                                        63
                                    ]
                                },
                                "detail": {
                                    "__typename": "Restaurant"
                                },
                                "name": "Bosporus Turkish Cuisine - Boulevard",
                                "geoName": "Dubai",
                                "locationDescription": "At Bosporus, we strongly believe that authentic food and hospitality can improve our wellbeing, as individuals and as a community. It gives us immense pleasure to see our customers enjoying their authentic Turkish food experience through us. We strive for continuous growth through dedicated commitment to our core values of integrity, respect, transparency and trust.",
                                "localizedStreetAddress": {
                                    "street1": "Sheikh Mohammed bin Rashid Boulevard",
                                    "fullAddress": "Sheikh Mohammed bin Rashid Boulevard Level LG, Unit LG - 115 - B, Dubai 12345 United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Restaurant_Review-g295424-d15185249-Reviews-Bosporus_Turkish_Cuisine_Boulevard-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Mirdif"
                                    }
                                ],
                                "cuisines": [
                                    {
                                        "localizedName": "Turkish"
                                    },
                                    {
                                        "localizedName": "Barbecue"
                                    },
                                    {
                                        "localizedName": "Grill"
                                    }
                                ],
                                "price": [
                                    {
                                        "localizedName": "$$"
                                    }
                                ],
                                "locationV2": {
                                    "bestAwardForActiveYearV2": null,
                                    "tags": {
                                        "tags": []
                                    },
                                    "rentalDetails": null,
                                    "details": null,
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    }
                                },
                                "thumbnail": {
                                    "id": 714953345,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/9d/52/81/bosporus-boulevard.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/2a/9d/52/81/bosporus-boulevard.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/2a/9d/52/81/bosporus-boulevard.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/2a/9d/52/81/bosporus-boulevard.jpg"
                                        },
                                        {
                                            "height": 193,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/2a/9d/52/81/bosporus-boulevard.jpg"
                                        },
                                        {
                                            "height": 425,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/2a/9d/52/81/bosporus-boulevard.jpg"
                                        },
                                        {
                                            "height": 791,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/2a/9d/52/81/bosporus-boulevard.jpg"
                                        },
                                        {
                                            "height": 989,
                                            "width": 1280,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2a/9d/52/81/bosporus-boulevard.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 352421746,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/01/87/72/the-bosporus-boulevard.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/15/01/87/72/the-bosporus-boulevard.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/15/01/87/72/the-bosporus-boulevard.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/15/01/87/72/the-bosporus-boulevard.jpg"
                                            },
                                            {
                                                "height": 153,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/15/01/87/72/the-bosporus-boulevard.jpg"
                                            },
                                            {
                                                "height": 338,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/15/01/87/72/the-bosporus-boulevard.jpg"
                                            },
                                            {
                                                "height": 629,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/15/01/87/72/the-bosporus-boulevard.jpg"
                                            },
                                            {
                                                "height": 663,
                                                "width": 1080,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/15/01/87/72/the-bosporus-boulevard.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 714953345,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/9d/52/81/bosporus-boulevard.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2a/9d/52/81/bosporus-boulevard.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2a/9d/52/81/bosporus-boulevard.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2a/9d/52/81/bosporus-boulevard.jpg"
                                            },
                                            {
                                                "height": 193,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2a/9d/52/81/bosporus-boulevard.jpg"
                                            },
                                            {
                                                "height": 425,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2a/9d/52/81/bosporus-boulevard.jpg"
                                            },
                                            {
                                                "height": 791,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2a/9d/52/81/bosporus-boulevard.jpg"
                                            },
                                            {
                                                "height": 989,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2a/9d/52/81/bosporus-boulevard.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 560954321,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/21/6f/7b/d1/enjoy-the-best-view-in.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/21/6f/7b/d1/enjoy-the-best-view-in.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/21/6f/7b/d1/enjoy-the-best-view-in.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/21/6f/7b/d1/enjoy-the-best-view-in.jpg"
                                            },
                                            {
                                                "height": 141,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/21/6f/7b/d1/enjoy-the-best-view-in.jpg"
                                            },
                                            {
                                                "height": 310,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/21/6f/7b/d1/enjoy-the-best-view-in.jpg"
                                            },
                                            {
                                                "height": 577,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/21/6f/7b/d1/enjoy-the-best-view-in.jpg"
                                            },
                                            {
                                                "height": 721,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/21/6f/7b/d1/enjoy-the-best-view-in.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 714965129,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/9d/80/89/the-best-turkish-sweets.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2a/9d/80/89/the-best-turkish-sweets.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2a/9d/80/89/the-best-turkish-sweets.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2a/9d/80/89/the-best-turkish-sweets.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2a/9d/80/89/the-best-turkish-sweets.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2a/9d/80/89/the-best-turkish-sweets.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2a/9d/80/89/the-best-turkish-sweets.jpg"
                                            },
                                            {
                                                "height": 854,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2a/9d/80/89/the-best-turkish-sweets.jpg"
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },
                {
                    "id": 703225063,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelerRankingData",
                                "type": "TravelerRankingData",
                                "rank": 9,
                                "total": 5156
                            },
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "CERTIFICATE_OF_EXCELLENCE",
                                "type": "TravelersChoiceAwardData"
                            },
                            {
                                "__typename": "Trips_HighlyRecommendedData",
                                "type": "HighlyRecommendedData",
                                "percentRecommended": 100
                            }
                        ],
                        "recommendedProduct": null,
                        "date": null,
                        "narrativeDescription": {
                            "text": "{{78781bf3-b742-4bbf-b886-deae7d3abac4}} in Dubai offers unlimited serving in a cozy atmosphere with large sofas, making it a quiet place to relax away from the crowds. With reasonable entrance fees, it provides a wide selection of drinks and freshly prepared food, including the amazing chicken tikka wrap. The lounge is known for its excellent customer service, attentive and friendly staff, and high hygiene standards. You can enjoy full body massage chairs, organic wine, and a quiet area to sleep if needed. This hidden gem is the best lounge at Dubai airport, with Mr. Kiran, Mr. Vikas, and Miss Tharushi providing exceptional hospitality.",
                            "plainText": "Ahlan Lounge @ Gate B26 in Dubai offers unlimited serving in a cozy atmosphere with large sofas, making it a quiet place to relax away from the crowds. With reasonable entrance fees, it provides a wide selection of drinks and freshly prepared food, including the amazing chicken tikka wrap. The lounge is known for its excellent customer service, attentive and friendly staff, and high hygiene standards. You can enjoy full body massage chairs, organic wine, and a quiet area to sleep if needed. This hidden gem is the best lounge at Dubai airport, with Mr. Kiran, Mr. Vikas, and Miss Tharushi providing exceptional hospitality.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "78781bf3-b742-4bbf-b886-deae7d3abac4",
                                    "value": "Ahlan Lounge @ Gate B26"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 16897846,
                            "object": {
                                "placeType": "ATTRACTION",
                                "isGeo": false,
                                "locationId": 16897846,
                                "latitude": 25.246775,
                                "longitude": 55.364582,
                                "neighborhoods": [],
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 9,
                                    "popIndexTotal": 5171
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 0,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 23,
                                                        "minutes": 59
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 5,
                                    "count": 4152,
                                    "ratingCounts": [
                                        5,
                                        11,
                                        19,
                                        237,
                                        3880
                                    ]
                                },
                                "cuisines": [],
                                "price": [],
                                "detail": {
                                    "__typename": "Attraction"
                                },
                                "name": "Ahlan Lounge @ Gate B26",
                                "geoName": "Dubai",
                                "locationDescription": "Ahlan Lounge @ Gate B26 offers an international a la carte menu for breakfast, lunch, dinner prepared by our Chef de Cuisine and his team. The food is served in a warm, welcoming decor along with a fine array of wines and spirits. The Ahlan Lounge @ Gate B26 is located near Gate B26 of Dubai International Airport, Terminal 3.",
                                "localizedStreetAddress": {
                                    "street1": "Dubai International Airport Terminal 3",
                                    "fullAddress": "Dubai International Airport Terminal 3, Dubai United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Attraction_Review-g295424-d16897846-Reviews-Ahlan_Lounge_Gate_B26-Dubai_Emirate_of_Dubai.html"
                                },
                                "thumbnail": {
                                    "id": 739446465,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/13/0e/c1/b26.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/13/0e/c1/b26.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/13/0e/c1/b26.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/13/0e/c1/b26.jpg"
                                        },
                                        {
                                            "height": 187,
                                            "width": 250,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/13/0e/c1/b26.jpg"
                                        },
                                        {
                                            "height": 412,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/13/0e/c1/b26.jpg"
                                        },
                                        {
                                            "height": 768,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/13/0e/c1/b26.jpg"
                                        },
                                        {
                                            "height": 960,
                                            "width": 1280,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/13/0e/c1/b26.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 386948558,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/10/5d/ce/lounge-seatings.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/17/10/5d/ce/lounge-seatings.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/17/10/5d/ce/lounge-seatings.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/17/10/5d/ce/lounge-seatings.jpg"
                                            },
                                            {
                                                "height": 164,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/17/10/5d/ce/lounge-seatings.jpg"
                                            },
                                            {
                                                "height": 360,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/17/10/5d/ce/lounge-seatings.jpg"
                                            },
                                            {
                                                "height": 654,
                                                "width": 1000,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/17/10/5d/ce/lounge-seatings.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 739446465,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/13/0e/c1/b26.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/13/0e/c1/b26.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/13/0e/c1/b26.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/13/0e/c1/b26.jpg"
                                            },
                                            {
                                                "height": 187,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/13/0e/c1/b26.jpg"
                                            },
                                            {
                                                "height": 412,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/13/0e/c1/b26.jpg"
                                            },
                                            {
                                                "height": 768,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/13/0e/c1/b26.jpg"
                                            },
                                            {
                                                "height": 960,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/13/0e/c1/b26.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 739447566,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/13/13/0e/seating-area.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/13/13/0e/seating-area.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/13/13/0e/seating-area.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/13/13/0e/seating-area.jpg"
                                            },
                                            {
                                                "height": 187,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/13/13/0e/seating-area.jpg"
                                            },
                                            {
                                                "height": 412,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/13/13/0e/seating-area.jpg"
                                            },
                                            {
                                                "height": 768,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/13/13/0e/seating-area.jpg"
                                            },
                                            {
                                                "height": 960,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/13/13/0e/seating-area.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 739446517,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/13/0e/f5/b26.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/13/0e/f5/b26.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/2c/13/0e/f5/b26.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 154,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/2c/13/0e/f5/b26.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/2c/13/0e/f5/b26.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 337,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/2c/13/0e/f5/b26.jpg"
                                            },
                                            {
                                                "height": 733,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/2c/13/0e/f5/b26.jpg"
                                            },
                                            {
                                                "height": 1280,
                                                "width": 960,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/13/0e/f5/b26.jpg"
                                            },
                                            {
                                                "height": 1366,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/2c/13/0e/f5/b26.jpg"
                                            }
                                        ]
                                    }
                                ],
                                "locationV2": {
                                    "rentalDetails": null,
                                    "details": {
                                        "__typename": "LocationSelection_AttractionDetails"
                                    },
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2024,
                                        "awardType": "COE"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    },
                                    "tags": {
                                        "tags": [
                                            {
                                                "tagId": 20389,
                                                "tag": {
                                                    "localizedName": "Airport Lounges"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "id": 703225064,
                    "object": {
                        "comments": [],
                        "communityContent": [
                            {
                                "__typename": "Trips_TravelersChoiceAwardData",
                                "awardType": "CERTIFICATE_OF_EXCELLENCE",
                                "type": "TravelersChoiceAwardData"
                            },
                            {
                                "__typename": "Trips_HighlyRecommendedData",
                                "type": "HighlyRecommendedData",
                                "percentRecommended": 96
                            }
                        ],
                        "recommendedProduct": null,
                        "date": null,
                        "narrativeDescription": {
                            "text": "{{af774ac3-702c-4e8c-81bd-f9b07a0b5f2d}} is a vibrant eatery in Dubai offering authentic Mexican cuisine with a wide range of options suitable for everyone, including vegetarian, vegan, and gluten-free dishes. You and your partner will enjoy the great drinks, such as homemade fresh cocktails and unlimited mocktails, served by friendly and attentive staff, some of whom are from Mexico. The sublime decor and Latin music create a lively atmosphere, perfect for a romantic evening. The reasonable prices ensure you get to savor flavorful Mexican food without breaking the bank. This hidden gem is a must-visit for food enthusiasts looking for a unique dining experience in Dubai.",
                            "plainText": "La Tablita Dubai is a vibrant eatery in Dubai offering authentic Mexican cuisine with a wide range of options suitable for everyone, including vegetarian, vegan, and gluten-free dishes. You and your partner will enjoy the great drinks, such as homemade fresh cocktails and unlimited mocktails, served by friendly and attentive staff, some of whom are from Mexico. The sublime decor and Latin music create a lively atmosphere, perfect for a romantic evening. The reasonable prices ensure you get to savor flavorful Mexican food without breaking the bank. This hidden gem is a must-visit for food enthusiasts looking for a unique dining experience in Dubai.",
                            "references": [
                                {
                                    "itemId": null,
                                    "name": "af774ac3-702c-4e8c-81bd-f9b07a0b5f2d",
                                    "value": "La Tablita Dubai"
                                }
                            ]
                        },
                        "object": {
                            "__typename": "Trips_LocationItemObject",
                            "locationId": 9594530,
                            "object": {
                                "placeType": "EATERY",
                                "isGeo": false,
                                "locationId": 9594530,
                                "latitude": 25.234112,
                                "longitude": 55.32396,
                                "naturalParentId": 295424,
                                "parentGeoId": 295424,
                                "countryId": 294012,
                                "accommodationCategory": "HOTEL",
                                "popIndexDetails": {
                                    "popIndexRank": 244,
                                    "popIndexTotal": 8690
                                },
                                "socialStatistics": {
                                    "isSaved": false
                                },
                                "hoursOfOperation": {
                                    "dailyTimeIntervals": [
                                        {
                                            "day": "MONDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 13,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 16,
                                                        "minutes": 0
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 18,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "TUESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 13,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 16,
                                                        "minutes": 0
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 18,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "WEDNESDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 13,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 16,
                                                        "minutes": 0
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 18,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "THURSDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 13,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 16,
                                                        "minutes": 0
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 18,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "FRIDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 13,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 16,
                                                        "minutes": 0
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 18,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SATURDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 13,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 17,
                                                        "minutes": 0
                                                    }
                                                },
                                                {
                                                    "openingTime": {
                                                        "hours": 18,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            "day": "SUNDAY",
                                            "timeIntervals": [
                                                {
                                                    "openingTime": {
                                                        "hours": 18,
                                                        "minutes": 0
                                                    },
                                                    "closingTime": {
                                                        "hours": 1,
                                                        "minutes": 0
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "reviewSummary": {
                                    "rating": 5,
                                    "count": 1408,
                                    "ratingCounts": [
                                        16,
                                        19,
                                        31,
                                        165,
                                        1177
                                    ]
                                },
                                "detail": {
                                    "__typename": "Restaurant"
                                },
                                "name": "La Tablita Dubai",
                                "geoName": "Dubai",
                                "locationDescription": "Welcome to the award winning lively Mexican restaurant La Tablita, a quirky and vibrant destination that serves authentic Mexican cuisine in a colorful, exciting and family-friendly environment. Live cooking and a passionate team of native Mexicans, both in the culinary and service teams, enliven the Mexican culture of shared dining, food, entertaining and celebrations for young and old. Enjoy flavors and service of the authentic and traditional Mexican cuisine in Dubai Healthcare City, Bur Dubai at Hyatt Regency Dubai Creek Heights.",
                                "localizedStreetAddress": {
                                    "street1": "20th Street",
                                    "fullAddress": "20th Street Lobby Level at Hyatt Regency Dubai Creek Heights, Dubai 5668 United Arab Emirates"
                                },
                                "route": {
                                    "url": "/Restaurant_Review-g295424-d9594530-Reviews-La_Tablita_Dubai-Dubai_Emirate_of_Dubai.html"
                                },
                                "neighborhoods": [
                                    {
                                        "name": "Umm Hurair 2"
                                    },
                                    {
                                        "name": "Umm Hurair"
                                    },
                                    {
                                        "name": "Bur Dubai"
                                    }
                                ],
                                "cuisines": [
                                    {
                                        "localizedName": "Mexican"
                                    },
                                    {
                                        "localizedName": "Latin"
                                    },
                                    {
                                        "localizedName": "Bar"
                                    },
                                    {
                                        "localizedName": "Central American"
                                    }
                                ],
                                "price": [
                                    {
                                        "localizedName": "$$"
                                    }
                                ],
                                "locationV2": {
                                    "tags": {
                                        "tags": []
                                    },
                                    "rentalDetails": null,
                                    "details": null,
                                    "names": {
                                        "longOnlyHierarchyTypeaheadV2": "Dubai, United Arab Emirates"
                                    },
                                    "bestAwardForActiveYearV2": {
                                        "year": 2023,
                                        "awardType": "COE"
                                    },
                                    "accommodationType": {
                                        "name": "Unknown"
                                    }
                                },
                                "thumbnail": {
                                    "id": 543328908,
                                    "photoSizes": [
                                        {
                                            "height": 0,
                                            "width": 0,
                                            "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/20/62/8a/8c/outdoor-friday-drunch.jpg?w=100&h=100&s=1"
                                        },
                                        {
                                            "height": 50,
                                            "width": 50,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-t/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                        },
                                        {
                                            "height": 150,
                                            "width": 150,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-l/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                        },
                                        {
                                            "height": 200,
                                            "width": 180,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-i/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                        },
                                        {
                                            "height": 205,
                                            "width": 205,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-f/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                        },
                                        {
                                            "height": 450,
                                            "width": 450,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-s/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                        },
                                        {
                                            "height": 550,
                                            "width": 550,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-p/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                        },
                                        {
                                            "height": 1024,
                                            "width": 1024,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-w/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                        },
                                        {
                                            "height": 1080,
                                            "width": 1080,
                                            "url": "https://media-cdn.tripadvisor.com/media/photo-o/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                        }
                                    ]
                                },
                                "photos": [
                                    {
                                        "id": 543328908,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/20/62/8a/8c/outdoor-friday-drunch.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                            },
                                            {
                                                "height": 205,
                                                "width": 205,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                            },
                                            {
                                                "height": 450,
                                                "width": 450,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                            },
                                            {
                                                "height": 550,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-p/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                            },
                                            {
                                                "height": 1024,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                            },
                                            {
                                                "height": 1080,
                                                "width": 1080,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/20/62/8a/8c/outdoor-friday-drunch.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 227769065,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0d/93/7a/e9/la-tablita-dining-area.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/0d/93/7a/e9/la-tablita-dining-area.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/0d/93/7a/e9/la-tablita-dining-area.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/0d/93/7a/e9/la-tablita-dining-area.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/0d/93/7a/e9/la-tablita-dining-area.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/0d/93/7a/e9/la-tablita-dining-area.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/0d/93/7a/e9/la-tablita-dining-area.jpg"
                                            },
                                            {
                                                "height": 820,
                                                "width": 1229,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-o/0d/93/7a/e9/la-tablita-dining-area.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 693631302,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/29/57/f9/46/cinco-de-mayo-at-la-tablita.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/29/57/f9/46/cinco-de-mayo-at-la-tablita.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/29/57/f9/46/cinco-de-mayo-at-la-tablita.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/29/57/f9/46/cinco-de-mayo-at-la-tablita.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/29/57/f9/46/cinco-de-mayo-at-la-tablita.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/29/57/f9/46/cinco-de-mayo-at-la-tablita.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/29/57/f9/46/cinco-de-mayo-at-la-tablita.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/29/57/f9/46/cinco-de-mayo-at-la-tablita.jpg"
                                            }
                                        ]
                                    },
                                    {
                                        "id": 693631301,
                                        "photoSizes": [
                                            {
                                                "height": 0,
                                                "width": 0,
                                                "url": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/29/57/f9/45/cinco-de-mayo-at-la-tablita.jpg?w=100&h=100&s=1"
                                            },
                                            {
                                                "height": 50,
                                                "width": 50,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-t/29/57/f9/45/cinco-de-mayo-at-la-tablita.jpg"
                                            },
                                            {
                                                "height": 150,
                                                "width": 150,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-l/29/57/f9/45/cinco-de-mayo-at-la-tablita.jpg"
                                            },
                                            {
                                                "height": 200,
                                                "width": 180,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-i/29/57/f9/45/cinco-de-mayo-at-la-tablita.jpg"
                                            },
                                            {
                                                "height": 167,
                                                "width": 250,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-f/29/57/f9/45/cinco-de-mayo-at-la-tablita.jpg"
                                            },
                                            {
                                                "height": 367,
                                                "width": 550,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-s/29/57/f9/45/cinco-de-mayo-at-la-tablita.jpg"
                                            },
                                            {
                                                "height": 683,
                                                "width": 1024,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-w/29/57/f9/45/cinco-de-mayo-at-la-tablita.jpg"
                                            },
                                            {
                                                "height": 853,
                                                "width": 1280,
                                                "url": "https://media-cdn.tripadvisor.com/media/photo-m/1280/29/57/f9/45/cinco-de-mayo-at-la-tablita.jpg"
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            ]
        };
    }

    async _createItinerary(tripId: number, params: CreateTripDto) {
        const { currency = 'ILS', numberOfDays = DEFAULT_NUM_OF_DAYS } = params;

        let trip;
        if (this.debugMode){
            trip = this.getTripFromCache();
        } else {
            const data = JSON.stringify([
                {
                    "variables": {
                        "tripIds": [
                            tripId
                        ],
                        "currency": currency ?? "ILS"
                    },
                    "extensions": {
                        "preRegisteredQueryId": "7736e0b2af583968"
                    }
                }
            ]);

            const config = {
                headers: {
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9,he;q=0.8',
                    'content-type': 'application/json',
                    'cookie': '_lc2_fpi=b140173de591--01gt429gejrkxt413pqa652v0a; _ga=GA1.1.638195325.1689358016; TASameSite=1; TAUnique=%1%enc%3A0bPt1DAbYLIqESpYS80bugE8%2B5kuzt268t5VIrI2MPcjSQ4AgGj8MYa8cLRVZTbhNox8JbUSTxk%3D; TASSK=enc%3AAL9%2FMo7e0LFaHvbB4kNE6KtR7Ii3NAFypprnC7ot6mhaZn9rdNcrDztNHuC3QAdjtblZSysSh4o5%2BmxIqMBt8jjSWRiYaIyD78WQKEe2OT%2BW99oEwcmfzaQiOOwv57BBsA%3D%3D; VRMCID=%1%V1*id.10568*llp.%2FSmartDeals-g295424-Dubai_Emirate_of_Dubai-Hotel-Deals%5C.html*e.1718974228161; TATrkConsent=eyJvdXQiOiJTT0NJQUxfTUVESUEiLCJpbiI6IkFEVixBTkEsRlVOQ1RJT05BTCJ9; _gcl_au=1.1.1974327381.1718369431; pbjs_sharedId=653f5e58-fe42-49cb-a99a-9a5da5a0cc87; pbjs_sharedId_cst=zix7LPQsHA%3D%3D; _lc2_fpi_meta=%7B%22w%22%3A1718369435081%7D; _lr_env_src_ats=false; pbjs_unifiedID=%7B%22TDID%22%3A%225c2f933c-fe19-45d0-9e85-0f04151db2c3%22%2C%22TDID_LOOKUP%22%3A%22TRUE%22%2C%22TDID_CREATED_AT%22%3A%222024-05-14T12%3A50%3A42%22%7D; pbjs_unifiedID_cst=zix7LPQsHA%3D%3D; TART=%1%enc%3AacB1OBrvcdiX91CQe8UUWjZtUu8yeRrwKH8dpdaX369zUgJZMudUDpl88bVjzUV6MiviWETFWp4%3D; _li_dcdm_c=.tripadvisor.com; ServerPool=C; TATravelInfo=V2*A.2*MG.-1*HP.2*FL.3*RS.1; TADCID=ZFVhNjQZz3T_4VKtABQCmq6heh9ZSU2yA8SXn9Wv5H66vIwuI_WELKmDFgkE7BTB6AcQY-1VTQ1nPSPfYOdP0IABpeyOuKbjvFc; PMC=V2*MS.72*MD.20240614*LD.20240707; _lr_sampling_rate=100; pbjs_li_nonid=%7B%7D; pbjs_li_nonid_cst=zix7LPQsHA%3D%3D; TASID=480C31B8757865F5A4EA6F3386F554AE; _abck=CFCC95316C817ECEC69FF1FC649B009D~-1~YAAQNyhDF6I1YWyQAQAAsUX9jAwEgjiMViNAU++ud6WIsK0QhqFpa3s73CaBUfa2pb9y8cCwl7egx3qWV/RIMnuxS1BK2l5LreXrLj+Ic/noXsFEPFJn/8NMTQm8EHnAaeWDeZeXSooTb6OdWZqdgo6vEFjJcmHWLAl7cEiPWuTJ7j4fsVw2tRDr3DO+SPSYjUrjmWm5QICRBf799DH/FyTKU6BwdULjLcmzsUKgafePYO8rOOxAxFAik/8+IOKuL8mmueGf9mJt5tcvAGF9i+mz8PSZ8/xWeWUedK3OI5QL9j46UjKoIUfLuzoRw9MAzgp2L2XhLHyj//NG+emTUu6MIi9DVlrhmoxeTXyTuH4LCCVKBU7LSwH1D2NtDRfhbdIjBg==~-1~-1~-1; PAC=AMkQ1HRdOZUoNqZ5yECKEQg31a4v5B5N-xFKdBqv10rC41WEGaAf1rq6TRLVP8ATvDzJP0NAJ0LBbdUudDlAC0d0hZHZ5vdixC8DyUfXIqzKXH_C3QLpo1Vp13mlflRkJQtkuym6WAqPPZTrldjW76hrS8OKGvw7iWbBXtZMUbwMCCec8yggMo7F5LBDoyMzb_EyzDLbd0Ie05COaE6jh_uueQq7CheWc6xZpDKs3smxLb-K152F_ay33N_eQyPXBc5W2slFuqeY9pTpp1Gv5yo%3D; __gads=ID=66a69a46b8e21b64:T=1718369436:RT=1720352329:S=ALNI_MZjmygAUKC3s81bj9XdFj5F8wfjCA; __gpi=UID=00000e3a96c5fbe2:T=1718369436:RT=1720352329:S=ALNI_MYw9d2pn0a3N4lRHQ7_Z-whAwkLXg; __eoi=ID=89724796ff128a3b:T=1718369436:RT=1720352329:S=AA-AfjY8p-1xJWCJNvn3cTJxAJ4T; _lr_retry_request=true; ab.storage.deviceId.6e55efa5-e689-47c3-a55b-e6d7515a6c5d=%7B%22g%22%3A%225e259853-1479-e243-c1ef-2917192fcb99%22%2C%22c%22%3A1718369430721%2C%22l%22%3A1720352524279%7D; ab.storage.sessionId.6e55efa5-e689-47c3-a55b-e6d7515a6c5d=%7B%22g%22%3A%22b14957d9-273c-ce5f-cdf0-f6b74e76c749%22%2C%22e%22%3A1720352539286%2C%22c%22%3A1720352524278%2C%22l%22%3A1720352524286%7D; G_AUTH2_MIGRATION=informational; TAAUTHEAT=5bAR7bH7bdgFByxZABQCNrrFLZA9QSOijcELs1dvVz6S7MHyvadU9A5Q4kfiNiWxg90WaoxdxBQduCPnOUd8qjRbEiVniAwFehqqsjfwMJd6euxLlGruWT8ChsI7KOKDy7FPFU7trLIiRAovHiU1c3-7bc5JqilHgI7FRmmNGbVkcg0ZhN-tYW4gX3Pnb-Goa3ysxBNemZUwodKOu_zW6YqJRNJDhuYi3yxV; __vt=12pZ5BTH3ETkt7NcABQCwRB1grfcRZKTnW7buAoPsS6ZjIYZS5_-9_WO9QlQ0seJ94hc3m-ChrpIFaahQ2dUvbwNEB4cmgIVjSo2h_RjB_IYTem1FDU_54FFW_q7Yq4a3t44LBB7dDxDDdfFMIaUBXUUCKXxQ0Z4_IjqKavFKFeFM3GjZNmjLN8kHZQ_grfXY50wrMsC4zTct_7rpQgUY1wEE0B2iLTbIiIrcgEagns9hJrlw2USaxOte4MS_WqWh_sEwy7_N4L-9JwQVvzCY41Gncmz7hKRz_U6VYoP4XeUEgpJ2VcDjKDjEg7B9AidlDZ93uo--pC29yYE3Phii9SpO4aqdnHRmXCw1WC57ffLmKnLTTxJZY0l5aC9V66HxHGRzwX-m98bCqlM_4jeVwajoKAl8A; AMZN-Token=v2FweIBrWnJxVWtibEdaSVdHMDlQTlNJNy9VQzlmSG55SEx3NkhZM2toY1hSeWpwVEpoZG9GWmo3KzdHazBxcHFGb3p2Mlc5OU9DYzdETFhpNU5aVDhyak9pM1l4RXh2cXlkVmZ5TFhPRGlGK1hvZHIyZEFZR0dEOWM2QUdtMGlVN0wyOWJrdgFiaXZ4HDc3Kzk3Nys5T0djVkwyRjQ3Nys5Wm5idnY3MD3/; TAUD=LA-1720120391622-1*RDD-2-2024_07_04*ARC-2727761*LG-232251956-2.1.F.*LD-232251957-.....; OptanonConsent=isGpcEnabled=0&datestamp=Sun+Jul+07+2024+14%3A44%3A04+GMT%2B0300+(Israel+Daylight+Time)&version=202310.2.0&isIABGlobal=false&hosts=&consentId=CACC3E8153BD94E1CD3B50C018FBD8BA&interactionCount=2&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1&AwaitingReconsent=false&browserGpcFlag=0; _gcl_aw=GCL.1720352644.null; TASession=%1%V2ID.480C31B8757865F5A4EA6F3386F554AE*SQ.46*PR.40612%7C*LS.AITripBuilder*HS.recommended*ES.popularity*DS.5*SAS.popularity*FPS.oldFirst*TS.CACC3E8153BD94E1CD3B50C018FBD8BA*FA.1*DF.0*TRA.true*LD.19175168*EAU.C; _ga_QX0Q50ZC9P=GS1.1.1720352327.7.1.1720352644.60.0.0; datadome=L8ThYowiKxMqiernvf4vlCKZxLalqLhTUUQd44l7YJe~gR_ymuO2AxVWWc7meeKvby2DC7OGX778J2j8K5Dc6ptBI~33aqw5mq2HXXNmwqk_60cLOyc73qq31TEQLqLI; SRT=TART_SYNC; TAUnique=%1%enc%3AD%2Fch1%2BQ2hpeH0%2F%2BuCFHlKaolf3ScFFQaXQs0JsPcVadR7t%2FphnBsBy96c2%2FgF6t%2BNox8JbUSTxk%3D; _abck=CFCC95316C817ECEC69FF1FC649B009D~-1~YAAQ19XOF3ycZnqQAQAATzZBfww7GNhhb/2krsqQkvcw+0dcsBNbga4UGT4U9Lu6i88DM7unD7HndaedVUvHHiQDi8nPnrSpzGXP1Y3AhI1h/ZmSCGl+Mzkov2Nyj8tLduV85WzD2MpRRIAXMBZ/Bua6vcZ2nmOADPWHMncvswhzCBTg9gkCbhy2G+S++nOfcol0zdeq6CDzKww1YNqLayos5eR7R5HCe5QvyZDFDPClNMSL6xxvz7TBIkowzQngDWwzjNvswc6knjR+zP0tCfp7VGMYx8pW8W0wLoIadYF2qP2FJTZnGFfoWgayA2vaS/Zr/sTMBcPIDzyBa8ckaXXoZGqPDEKaPbwBEsYXUbR/0x7L9PF/qisQqUUXMpRXk1zppA==~-1~-1~-1; __vt=53woWvUrjg6fHgXSABQCwRB1grfcRZKTnW7buAoPsS6ZlAbB6wDyrWye_x70O0xgWNX-qzbJL3dOYnvL7H0UZ6a_Zh3i0VhwcUTZZ-qFqXBuG7QBTYl6ZbCnAWB8YVdVP6m72jBjnr0UZMkNeA6fqAikzw',
                    'origin': 'https://www.tripadvisor.com',
                    'priority': 'u=1, i',
                    'referer': 'https://www.tripadvisor.com/AITripBuilder',
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
                }
            };

            await sleep(60000);

            const response = await axios.post('https://www.tripadvisor.com/data/graphql/ids', data, config);
            trip = response.data?.[0]?.["data"]?.["Trips_getTrips"]?.[0];
        }

        if (!trip){
            return trip;
        }


        const calendarLocale = params.calendarLocale ?? "he";

        const travelingWith = getClasses(
            // @ts-ignore
            params.travelingWith === 'SPOUSE' && 'partner', params.travelingWith === 'FAMILY' && 'family', params.travelingWith === 'FRIENDS' && 'friends', params.includeChildren && 'children', params.includePets && 'pets'
        );

        function getTripName(){
            if (calendarLocale === "he"){
                const where = destinationTranslations['he']?.[params.destination] ?? params.destination;
                const days = `${numberOfDays} ימים`;
                const travelingWith = getClasses(
                    // @ts-ignore
                    params.travelingWith === 'SPOUSE' && 'בני זוג', params.travelingWith === 'FAMILY' && 'משפחה', params.travelingWith === 'FRIENDS' && 'חברים', params.includeChildren && 'ילדים', params.includePets && 'חיות'
                );
                return getClasses(`${where} ל ${days} עם ${travelingWith}`);
            } else {
                const days = `${numberOfDays} days`;
                return getClasses(`${params.destination} x ${days} with ${travelingWith}`);
            }
        }

        const allEvents = trip["items"].map((i) => this.format(i, params))

        // add non standard categories if needed
        let categories = getDefaultCategories();
        allEvents.forEach((e) => {
            let category = categories.find((c) => e.category == c.title);
            if (!category) {
                category = getNonDefaultCategories(categories.length, e.category);
                categories.push(category);
            }
            e.category = category.id;
        })

        function buildCalendarEvents(trip: Record<string, any>, allEvents: Event[], params: CreateTripDto) {
            // Helper function to parse a time string (HH:MM) into minutes
            function parseDuration(duration: string): number {
                const [hours, minutes] = duration.split(':').map(Number);
                return hours * 60 + minutes;
            }

            // Helper function to add minutes to a date and return a new date
            function addMinutesToDate(date: Date, minutes: number): Date {
                return new Date(date.getTime() + minutes * 60000);
            }

            // Helper function to format a date to ISO string
            function formatISO(date: Date): string {
                return date.toISOString();
            }

            // Helper function to convert a string date to a Date object (ignoring timezone)
            function parseDate(dateStr: string): Date {
                const [year, month, day] = dateStr.split('-').map(Number);
                return new Date(year, month - 1, day);
            }

            // Helper function to get a random number within a range
            function getRandomInt(min: number, max: number): number {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }

            // Helper function to round a date's minutes to the nearest 15-minute increment
            function roundToNearest15Minutes(date: Date): Date {
                const minutes = date.getMinutes();
                const remainder = minutes % 15;
                const adjustment = remainder >= 7.5 ? 15 - remainder : -remainder;
                date.setMinutes(minutes + adjustment);
                return date;
            }

            // Constants for daily time range (10 AM to 11 PM)
            const DAY_START_HOUR = 10;
            const DAY_END_HOUR = 23;

            // Range for variability in gaps between events
            const MIN_GAP_MINUTES = 30;
            const MAX_GAP_MINUTES = 180; // 3 hours in minutes

            // Parse trip start date
            const tripStartDate = parseDate(params.dateRange.start);

            // Mapping allEvents by ID for quick lookup
            const allEventsById = allEvents.reduce((acc, event) => {
                acc[event["id"]] = event;
                return acc;
            }, {} as Record<string, Event>);

            const unusedEventsById = { ...allEventsById };
            const calendarEvents = [];

            // Iterate through each day's itinerary in the trip structure
            trip?.["structure"]?.["buckets"]?.forEach((dayItinerary, dayIndex) => {
                const dayStart = new Date(tripStartDate);
                dayStart.setDate(tripStartDate.getDate() + dayIndex);
                dayStart.setHours(DAY_START_HOUR, 0, 0, 0); // Set to 10 AM

                const dayEnd = new Date(dayStart);
                dayEnd.setHours(DAY_END_HOUR, 0, 0, 0); // Set to 11 PM

                const items = dayItinerary?.["items"]?.map((itemId: string) => allEventsById[itemId]);

                // Calculate total duration of all events
                const totalEventMinutes = items.reduce((sum, item) => sum + parseDuration(item["duration"]), 0);

                // Calculate the remaining time for gaps
                const availableGapTime = (dayEnd.getTime() - dayStart.getTime()) / 60000 - totalEventMinutes;

                // Initial time is the start of the day
                let currentTime = dayStart;

                // Distribute events and gaps throughout the day
                items.forEach((item, index) => {
                    if (item) {
                        const durationInMinutes = parseDuration(item["duration"]);

                        // Round current time to the nearest 15-minute increment
                        currentTime = roundToNearest15Minutes(currentTime);

                        // Set start and end times for the item
                        const start = currentTime;
                        const end = addMinutesToDate(currentTime, durationInMinutes);

                        calendarEvents.push({
                            ...item,
                            start: formatISO(start),
                            end: formatISO(end)
                        });

                        // Determine a random gap for the next event, ensuring we don't exceed the day's end time
                        let randomGap = getRandomInt(MIN_GAP_MINUTES, MAX_GAP_MINUTES);
                        const remainingTimeForGaps = availableGapTime / (items.length - index - 1);
                        if (randomGap > remainingTimeForGaps) {
                            randomGap = remainingTimeForGaps; // Cap gap to avoid exceeding available time
                        }

                        // Ensure gap is a multiple of 15 minutes
                        randomGap = Math.ceil(randomGap / 15) * 15;

                        // Update currentTime to the end of this event plus the random gap
                        currentTime = addMinutesToDate(end, randomGap);

                        // Remove this event from unusedEvents
                        delete unusedEventsById[item["id"]];
                    }
                });
            });

            // Collect unused events
            const sidebarEvents = Object.values(unusedEventsById).filter(Boolean);


            return { calendarEvents, sidebarEvents };
        }

        const { calendarEvents, sidebarEvents } = buildCalendarEvents(trip, allEvents, params)

        categories.forEach((c) => {
            c.title = categoryTranslations[calendarLocale][c.title] ?? c.title;
        });

        return {
            name: getTripName(),
            numOfDays: numberOfDays,
            categories,
            allEvents,
            sidebarEvents: {},
            dateRange: params.dateRange,
            calendarEvents,
            calendarLocale,
            destinations: [
                params.destination
            ],
        }
    }

    async createTripadvisorTrip(params: CreateTripDto, user: User, request: Request) {
        this.logger.log(`creating trip using ai... fetching location id for ${params.destination}`)
        const locationId = await this.getLocationId(params.destination);
        if (!locationId) {
            this.logger.log(`location not found`)
            throw new NotFoundException(`location named '${params.destination}' not found`);
        }
        this.logger.log(`location found! ${locationId}\ncreating tripadvisor trip...`)

        let tripAdvisorTripId;
        if (this.debugMode){
            tripAdvisorTripId = this.getTripFromCache()["id"];
        } else {
            tripAdvisorTripId = await this._createTrip(params, locationId);
        }
        this.logger.log(`created trip advisor trip! ${tripAdvisorTripId}`)

        if (!tripAdvisorTripId) {
            this.logger.log(`failed creating tripadvisor trip :(`)
            throw new BadRequestException(`failed creating a TripAdvisor trip for destination: '${params.destination}'`);
        }

        this.logger.log(`tripadvisor trip created! ${tripAdvisorTripId}\ncreating itinerary...`)
        const itinerary = await this._createItinerary(tripAdvisorTripId, params);

        this.logger.log(`itinerary created! ${itinerary['name']}\ncreating Triplan trip...`)

        // create a trip
        // 5q/1>O8dlf4W
        // const templatesUser = await this.userService.getUserByName("templates");
        const createdTrips = await Promise.all([
            // this.tripService.createTrip(itinerary, templatesUser, request),
            this.tripService.createTrip(itinerary, user, request)
        ]);

        this.logger.log(`trip created! ${createdTrips?.[0]['name']}`)

        // todo complete:
        // keep on db
        // await this.poiService.upsertAll(results, user);

        return {
            itinerary,
            createdTrips
        };
    }
}
