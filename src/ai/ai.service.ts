import {BadRequestException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import axios from "axios";
import {CreateTripDto} from "./dto/create-trip-dto";
import {User} from "../user/user.entity";
import {convertTime, extractCategory} from "../poi/utils/utils";
import {TripService} from "../trip/trip.service";
import {UserService} from "../user/user.service";
import {Request} from "express";

// todo complete:
// parameterize - currency, language
// keep to PointOfInterests
// keep to TripTemplates

const DEFAULT_NUM_OF_DAYS = 7;
const DEFAULT_EVENT_DURATION = "01:00";
const DEFAULT_EVENT_DURATION_MIN = 60;

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
export class AIService {
    private logger = new Logger("AIService");
    private debugMode = false; // change to false
    private nameToId = {};
    private id = 1;

    constructor(
        private userService: UserService,
        private tripService: TripService,
        // private poiService: PointOfInterestService
    ) {
    }

    async getLocationId(destination: string) {
        const config = {
            headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9,he;q=0.8',
                'cookie': '_ga=GA1.1.1750019122.1726229255; session_id=041fc7a9-3c0c-4805-8854-80ec8244cf2b; _ga_H8E2Z4JKJP=GS1.1.1726229254.1.1.1726230227.0.0.0',
                'priority': 'u=1, i',
                'referer': 'https://wonderplan.ai/v2/trip-planner',
                'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'x-requested-with': 'XMLHttpRequest'
            }
        };

        const response = await axios.get(`https://wonderplan.ai/api/v1/destinations?q=${encodeURIComponent(destination)}&page=0`, config);
        return response.data["destinationMetas"].find((r) => r["id"].toLowerCase().includes(destination.toLowerCase()))?.["id"] ??
            response.data["destinationMetas"]?.[0]?.["id"]
    }

    getItemId(item: Record<string, any>) {
        if (item["id"]) {
            return item["id"];
        }
        const name = item['title'] ?? item['location'];

        if (this.nameToId[name]) {
            return this.nameToId[name];
        }
        const toReturn = this.id;
        this.nameToId[name] = toReturn;
        this.id += 1;
        return toReturn;
    }

    format(item: Record<string, any>, params){
        const description = item["description"]

        const title = item["location"]

        const location = {
            address: item["locationAddress"] || item["location"],
            latitude: item["lat"],
            longitude: item["lng"],
        };
        const category = extractCategory([
            title,
            description ?? "",
        ]) || "CATEGORY.GENERAL";

        const durationString = item["durationMin"] ? `${item["durationMin"]} minutes` : undefined;
        const duration = durationString ? convertTime(durationString) : DEFAULT_EVENT_DURATION;

        const formatTime = (time) => {
            // Pad hours and minutes to always be two digits
            const hours = String(time.hours).padStart(2, '0');
            const minutes = String(time.minutes).padStart(2, '0');
            return `${hours}:${minutes}`;
        };

        const moreInfo = this.removePID(item["affiliateLinks"]?.[0]?.["link"]);

        const priority = TriplanPriority.unset;

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
            id: this.getItemId({ title }),
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
            images: item["imageUrl"],
            moreInfo,
            price: item["budgetUsd"],
            currency: "usd",
            extra: {
                currency: "usd",
                category: category,
                categoryId: category,
            }
        }
    }

    async _createTrip(params: CreateTripDto, locationId: number) {
        // todo add: travelingWith
        // todo add: includePets?
        // todo add: includeChildren?
        // todo add: interests?

        const data = JSON.stringify({
            "destinationDestinationId": locationId,
            "travelAt": "2024-09-19T21:00:00.000Z",
            "days": params.numberOfDays,
            "budgetType": 3, // todo complete - add to params
            "groupType": 2, // todo complete - add to params
            "activityTypes": [
                1,
                2,
                3,
                6,
                5,
                4,
                7,
                8
            ],
            "isVegan": false,
            "isHalal": false
        });

        const config = {
            headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9,he;q=0.8',
                'content-type': 'application/json',
                'cookie': '_ga=GA1.1.1750019122.1726229255; session_id=041fc7a9-3c0c-4805-8854-80ec8244cf2b; _ga_H8E2Z4JKJP=GS1.1.1726229254.1.1.1726229896.0.0.0',
                'origin': 'https://wonderplan.ai',
                'priority': 'u=1, i',
                'referer': 'https://wonderplan.ai/v2/trip-planner',
                'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
            },
            data : data
        };

        const response = await axios.post('https://wonderplan.ai/api/v4/trips/generate', data, config)
        const tripId = response.data?.["id"];
        return tripId;
    }

    getTripFromCache(){
        return {
            "id": "v4-1726230290765-01905",
            "itinerary": [
                {
                    "day": 1,
                    "activities": [
                        {
                            "localTime": "",
                            "location": "The High Line",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.739628,
                            "lng": -74.00821,
                            "locationType": 3,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/519474",
                            "budgetUsd": 0,
                            "durationMin": 120,
                            "activityTypes": [
                                2,
                                3
                            ],
                            "description": "An elevated park built on a former railway line, offering stunning city views and unique art installations.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=The+High+Line%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 519474,
                                "geoId": 60763
                            },
                            "aid": "1-0-28655"
                        },
                        {
                            "localTime": "",
                            "location": "Chelsea Market",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.7425,
                            "lng": -74.0061,
                            "locationType": 3,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/288031",
                            "budgetUsd": 20,
                            "durationMin": 90,
                            "activityTypes": [
                                5,
                                7
                            ],
                            "description": "A historic food hall and shopping destination in Manhattan.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Chelsea+Market%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 288031,
                                "geoId": 60763
                            },
                            "aid": "1-1-57508"
                        },
                        {
                            "localTime": "",
                            "location": "The Vessel",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.75378,
                            "lng": -74.00216,
                            "locationType": 3,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/16875019",
                            "budgetUsd": 0,
                            "durationMin": 60,
                            "activityTypes": [
                                2,
                                3
                            ],
                            "description": "A honeycomb-like structure offering unique views of the city.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=The+Vessel%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 16875019,
                                "geoId": 60763
                            },
                            "aid": "1-2-65101"
                        },
                        {
                            "localTime": "",
                            "location": "Top of the Rock",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.759003,
                            "lng": -73.979324,
                            "locationType": 3,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/587661",
                            "budgetUsd": 35,
                            "durationMin": 90,
                            "activityTypes": [
                                2,
                                7
                            ],
                            "description": "Iconic observation deck offering panoramic views of NYC.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Top+of+the+Rock%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 587661,
                                "geoId": 60763
                            },
                            "aid": "1-3-54309"
                        },
                        {
                            "localTime": "",
                            "location": "Times Square",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.75889,
                            "lng": -73.98512,
                            "locationType": 3,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/110145",
                            "budgetUsd": 20,
                            "durationMin": 60,
                            "activityTypes": [
                                2,
                                6,
                                7
                            ],
                            "description": "The heart of NYC, known for its bright lights and bustling atmosphere.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Times+Square%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 110145,
                                "geoId": 60763
                            },
                            "aid": "1-4-93459"
                        },
                        {
                            "localTime": "",
                            "location": "Dinner at The Clocktower",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 45.276955,
                            "lng": -111.3246,
                            "locationType": 2,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/2201954",
                            "budgetUsd": 50,
                            "durationMin": 120,
                            "activityTypes": [
                                5,
                                6
                            ],
                            "description": "Popular New York City restaurant known for its American cuisine and lively atmosphere.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Dinner+at+The+Clocktower%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 2201954,
                                "geoId": 45082
                            },
                            "aid": "1-5-46526"
                        },
                        {
                            "localTime": "",
                            "location": "Bar at The Modern",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 44.354,
                            "lng": -68.223,
                            "locationType": 6,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/60709",
                            "budgetUsd": 20,
                            "durationMin": 60,
                            "activityTypes": [
                                6
                            ],
                            "description": "Connecticut boasts a vibrant nightlife scene with bars offering live music, craft cocktails, and a lively atmosphere.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Bar+at+The+Modern%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 60709,
                                "geoId": 7929119
                            },
                            "aid": "1-6-12743"
                        }
                    ],
                    "summary": "Explore Chelsea, Hudson Yards, and Times Square with stunning views."
                },
                {
                    "day": 2,
                    "activities": [
                        {
                            "localTime": "",
                            "location": "Central Park",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.781246,
                            "lng": -73.96667,
                            "locationType": 3,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/105127",
                            "budgetUsd": 0,
                            "durationMin": 180,
                            "activityTypes": [
                                2,
                                3,
                                5
                            ],
                            "description": "A vast urban park in Manhattan, offering diverse activities and scenic beauty.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Central+Park%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 105127,
                                "geoId": 60763
                            },
                            "aid": "2-0-77247"
                        },
                        {
                            "localTime": "",
                            "location": "American Museum of Natural History",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.781338,
                            "lng": -73.97398,
                            "locationType": 5,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/210108",
                            "budgetUsd": 25,
                            "durationMin": 120,
                            "activityTypes": [
                                2,
                                5
                            ],
                            "description": "A world-renowned museum showcasing natural history, featuring dinosaur exhibits, a planetarium, and cultural artifacts.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=American+Museum+of+Natural+History%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 210108,
                                "geoId": 60763
                            },
                            "aid": "2-1-28943"
                        },
                        {
                            "localTime": "",
                            "location": "The Metropolitan Museum of Art",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.77943,
                            "lng": -73.96324,
                            "locationType": 5,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/105125",
                            "budgetUsd": 25,
                            "durationMin": 180,
                            "activityTypes": [
                                2,
                                7
                            ],
                            "description": "One of the world's largest and most comprehensive art museums, housing a vast collection spanning centuries and cultures.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=The+Metropolitan+Museum+of+Art%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 105125,
                                "geoId": 60763
                            },
                            "aid": "2-2-39299"
                        },
                        {
                            "localTime": "",
                            "location": "Dinner at The Spotted Pig",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 45.276955,
                            "lng": -111.3246,
                            "locationType": 2,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/2201954",
                            "budgetUsd": 50,
                            "durationMin": 120,
                            "activityTypes": [
                                5,
                                6
                            ],
                            "description": "Popular New York City restaurant known for its American cuisine and lively atmosphere.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Dinner+at+The+Spotted+Pig%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 2201954,
                                "geoId": 45082
                            },
                            "aid": "2-3-32730"
                        },
                        {
                            "localTime": "",
                            "location": "The Carlyle Bar",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 38.611355,
                            "lng": -89.37068,
                            "locationType": 4,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/4689442",
                            "budgetUsd": 25,
                            "durationMin": 60,
                            "activityTypes": [
                                6
                            ],
                            "description": "Upscale hotel bar known for its classic cocktails and live jazz.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=The+Carlyle+Bar%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 4689442,
                                "geoId": 35769
                            },
                            "aid": "2-4-91297"
                        }
                    ],
                    "summary": "Immerse yourselves in art, nature, and history in Central Park."
                },
                {
                    "day": 3,
                    "activities": [
                        {
                            "localTime": "",
                            "location": "Brooklyn Bridge",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.706367,
                            "lng": -73.99718,
                            "locationType": 3,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/102741",
                            "budgetUsd": 0,
                            "durationMin": 120,
                            "activityTypes": [
                                2,
                                3
                            ],
                            "description": "Iconic suspension bridge connecting Manhattan and Brooklyn, offering stunning views of the city.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Brooklyn+Bridge%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 102741,
                                "geoId": 60763
                            },
                            "aid": "3-0-93007"
                        },
                        {
                            "localTime": "",
                            "location": "Dumbo",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.703304,
                            "lng": -73.98823,
                            "locationType": 3,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/262130",
                            "budgetUsd": 50,
                            "durationMin": 90,
                            "activityTypes": [
                                2,
                                3,
                                5,
                                7
                            ],
                            "description": "A historic waterfront neighborhood known for its stunning views of the Brooklyn Bridge and Manhattan skyline.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Dumbo%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 262130,
                                "geoId": 60827
                            },
                            "aid": "3-1-05343"
                        },
                        {
                            "localTime": "",
                            "location": "Brooklyn Flea",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.655815,
                            "lng": -74.00857,
                            "locationType": 3,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/9722394",
                            "budgetUsd": 20,
                            "durationMin": 90,
                            "activityTypes": [
                                4,
                                7
                            ],
                            "description": "A vibrant marketplace featuring vintage finds, artisanal goods, and live music.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Brooklyn+Flea%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 9722394,
                                "geoId": 60827
                            },
                            "aid": "3-2-62248"
                        },
                        {
                            "localTime": "",
                            "location": "Dinner at The River Cafe",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 35.04291,
                            "lng": -92.90096,
                            "locationType": 2,
                            "locationAddress": "",
                            "budgetUsd": 150,
                            "durationMin": 120,
                            "activityTypes": [
                                5,
                                6
                            ],
                            "description": "A renowned fine dining restaurant with stunning views of the Manhattan skyline.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Dinner+at+The+River+Cafe%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 26940341,
                                "geoId": 29039
                            },
                            "aid": "3-3-85843"
                        },
                        {
                            "localTime": "",
                            "location": "The Roof at Park South",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.74233,
                            "lng": -73.983246,
                            "locationType": 2,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/7112365",
                            "budgetUsd": 25,
                            "durationMin": 60,
                            "activityTypes": [
                                2,
                                6
                            ],
                            "description": "A rooftop bar with stunning views of the city, offering cocktails and small plates.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=The+Roof+at+Park+South%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 7112365,
                                "geoId": 60763
                            },
                            "aid": "3-4-99230"
                        }
                    ],
                    "summary": "Explore Brooklyn Bridge, Dumbo, and enjoy a romantic dinner with a view."
                },
                {
                    "day": 4,
                    "activities": [
                        {
                            "localTime": "",
                            "location": "The Frick Collection",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.771282,
                            "lng": -73.96739,
                            "locationType": 5,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/107466",
                            "budgetUsd": 25,
                            "durationMin": 90,
                            "activityTypes": [
                                2,
                                7
                            ],
                            "description": "A renowned museum showcasing European art from the Middle Ages to the early 20th century.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=The+Frick+Collection%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 107466,
                                "geoId": 60763
                            },
                            "aid": "4-0-94284"
                        },
                        {
                            "localTime": "",
                            "location": "The Morgan Library & Museum",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.74922,
                            "lng": -73.9814,
                            "locationType": 5,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/107356",
                            "budgetUsd": 25,
                            "durationMin": 90,
                            "activityTypes": [
                                2,
                                7
                            ],
                            "description": "A historic library and museum showcasing rare books, manuscripts, and art.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=The+Morgan+Library+%26+Museum%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 107356,
                                "geoId": 60763
                            },
                            "aid": "4-1-32646"
                        },
                        {
                            "localTime": "",
                            "location": "Shopping on Fifth Avenue",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 40.7744161,
                            "lng": -73.9656185,
                            "locationType": 7,
                            "locationAddress": "5th Ave, New York, NY, USA",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/gm/place/photos/ChIJ9Uc4naJYwokRSndBAbr7TVY/AelY_Csm7SBuuOXRDBxF_dYCSg8vavSBXoZNPgGrfRWxd_ISuC-FQsSJrohSR1TJXO969WDK-1DQFj5I2mbzseaCK5Ls5kMpghKk04ohko2iAZGA0I-Y64kPL6Jyj7g2qDqvlaCH6j2-y1HX0LnssKQe6HVKsQ22BNSWNhAAklM67GGGXEKm",
                            "budgetUsd": 100,
                            "durationMin": 120,
                            "activityTypes": [
                                7
                            ],
                            "description": "Fifth Avenue is a world-renowned shopping destination with luxury boutiques and department stores.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Shopping+on+Fifth+Avenue%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "placeId": "ChIJ9Uc4naJYwokRSndBAbr7TVY"
                            },
                            "aid": "4-2-10242"
                        },
                        {
                            "localTime": "",
                            "location": "Dinner at The NoMad Restaurant",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 45.276955,
                            "lng": -111.3246,
                            "locationType": 2,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/2201954",
                            "budgetUsd": 50,
                            "durationMin": 120,
                            "activityTypes": [
                                5,
                                6
                            ],
                            "description": "Popular New York City restaurant known for its American cuisine and lively atmosphere.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=Dinner+at+The+NoMad+Restaurant%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 2201954,
                                "geoId": 45082
                            },
                            "aid": "4-3-97729"
                        },
                        {
                            "localTime": "",
                            "location": "The Bar Room at The NoMad",
                            "city": "New York City",
                            "state": "NY",
                            "lat": 39.50603,
                            "lng": -87.46482,
                            "locationType": 3,
                            "locationAddress": "",
                            "imageUrl": "https://storage.googleapis.com/public-us-wonderplan-ai/images/ta/thumbnails/37497",
                            "budgetUsd": 0,
                            "durationMin": 60,
                            "activityTypes": [
                                2,
                                3
                            ],
                            "description": "The Caperton Train Station is a historic landmark and a popular spot for photography.",
                            "affiliateLinks": [
                                {
                                    "provider": 6,
                                    "link": "https://www.viator.com/searchResults/all?mcid=42383&medium=link&pid=P00206813&text=The+Bar+Room+at+The+NoMad%2C+New+York+City"
                                }
                            ],
                            "locationMeta": {
                                "locationId": 37497,
                                "geoId": 28935
                            },
                            "aid": "4-4-70137"
                        }
                    ],
                    "summary": "Explore art and culture in Upper East Side and enjoy a luxurious evening."
                }
            ]
        }
    }

    buildCalendarEvents(trip: Record<string, any>, allEvents: Event[], params: CreateTripDto) {
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
        trip?.["itinerary"]?.forEach((dayItinerary, dayIndex) => {
            const dayStart = new Date(tripStartDate);
            dayStart.setDate(tripStartDate.getDate() + dayIndex);
            dayStart.setHours(DAY_START_HOUR, 0, 0, 0); // Set to 10 AM

            const dayEnd = new Date(dayStart);
            dayEnd.setHours(DAY_END_HOUR, 0, 0, 0); // Set to 11 PM

            const items = dayItinerary?.["activities"].map((i) => this.format(i, params));

            // Calculate total duration of all events
            const totalEventMinutes = items.reduce((sum, item) => sum + (item["durationMin"] ?? DEFAULT_EVENT_DURATION_MIN), 0);

            // Calculate the remaining time for gaps
            const availableGapTime = (dayEnd.getTime() - dayStart.getTime()) / 60000 - totalEventMinutes;

            // Initial time is the start of the day
            let currentTime = dayStart;

            // Distribute events and gaps throughout the day
            items.forEach((item, index) => {
                if (item) {
                    const durationInMinutes = item["durationMin"] ?? DEFAULT_EVENT_DURATION_MIN;

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

    removePID(url) {
        if (!url){
            return url;
        }

        // Create a URL object
        const urlObj = new URL(url);

        // Get the search parameters
        const params = urlObj.searchParams;

        // Remove the 'pid' parameter
        try {
            params.delete('pid');
        } catch {

        }

        // Return the updated URL as a string
        return urlObj.toString();
    }

    async _createItinerary(tripId: number, params: CreateTripDto) {
        const { currency = 'ILS', numberOfDays = DEFAULT_NUM_OF_DAYS } = params;

        let trip;
        if (this.debugMode){
            trip = this.getTripFromCache();
        } else {

            const promises = [];
            for (let i = 0; i< params.numberOfDays; i++){
                promises.push(
                    axios.get(`https://sonderback-us-6h6yp6ucpq-uc.a.run.app/v4/trips/${tripId}/days/${Number(i+1)}:blocking`)
                )
            }

            const results = await Promise.all(promises);
            trip = {
                "id": tripId,
                "itinerary": results.map((r) => r["data"]).sort((a, b) => a["day"] - b["day"])
            }
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

        const allEvents = (trip["itinerary"].map((r) => r["activities"]).flat()).map((i) => this.format(i, params))

        // add non standard categories if needed
        let categories = getDefaultCategories();
        allEvents.forEach((e) => {
            let category = categories.find((c) => e.category == c.title);
            if (!category) {
                category = getNonDefaultCategories(categories.length, e.category);
                categories.push(category);
            }
            e.category = category.id;
            e.categoryId = category.id;
        });

        const { calendarEvents, sidebarEvents } = this.buildCalendarEvents(trip, allEvents, params)

        calendarEvents.forEach((e) => {
            let category = categories.find((c) => e.category == c.title);
            if (!category) {
                category = getNonDefaultCategories(categories.length, e.category);
                categories.push(category);
            }
            e.category = category.id;
            e.categoryId = category.id;
        })

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

    async createWonderplanTrip(params: CreateTripDto, user: User, request: Request) {
        this.logger.log(`creating trip using ai... fetching location id for ${params.destination}`)
        const locationId = await this.getLocationId(params.destination);
        if (!locationId) {
            this.logger.log(`location not found`)
            throw new NotFoundException(`location named '${params.destination}' not found`);
        }
        this.logger.log(`location found! ${locationId}`);
        this.logger.log("creating wonderplan trip...");

        let wonderplanTripId;
        if (this.debugMode){
            wonderplanTripId = this.getTripFromCache()["id"];
        } else {
            wonderplanTripId = await this._createTrip(params, locationId);
        }
        if (!wonderplanTripId) {
            this.logger.log(`failed creating tripadvisor trip :(`)
            throw new BadRequestException(`failed creating a TripAdvisor trip for destination: '${params.destination}'`);
        }
        this.logger.log(`wonderplan trip created! ${wonderplanTripId}`);

        this.logger.log("creating itinerary...")
        const itinerary = await this._createItinerary(wonderplanTripId, params);

        this.logger.log(`itinerary created! ${itinerary['name']}`)
        this.logger.log("creating Triplan trip...")

        // create a trip
        // 5q/1>O8dlf4W
        const templatesUser = await this.userService.getUserByName("templates");
        const createdTrips = await Promise.all([
            this.tripService.createTrip(itinerary, templatesUser, request, false),
            this.tripService.createTrip(itinerary, user, request, false)
        ]);

        this.logger.log(`trip created! ${createdTrips?.[0]?.['name']}`)

        // todo complete:
        // keep on db
        // await this.poiService.upsertAll(results, user);

        return {
            itinerary,
            createdTrips
        };
    }
}
