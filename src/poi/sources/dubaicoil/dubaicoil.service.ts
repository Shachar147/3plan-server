import {Injectable, Logger} from '@nestjs/common';
import {BaseSourceService} from "../base-source-service";
import {SearchResults} from "../../utils/interfaces";
import {SearchDto} from "../../dto/search-dto";
import {PointOfInterestService} from "../../poi.service";
import {User} from "../../../user/user.entity";
import axios from "axios";

@Injectable()
export class DubaicoilService implements BaseSourceService{

    private destination = "Dubai";
    private source = "Dubai.co.il"
    private currency = "ILS";
    private language = "he"; // en-US
    private logger = new Logger("DubaicoilService");

    constructor(
        private poiService: PointOfInterestService
    ) {
    }

    getPhotos(block: string): string[] {
        let n = block.indexOf('srcset="https://dubai.co');
        if (n === -1) {
            n = block.indexOf("data-lazy-src=");
            if (n === -1) {
                return [];
            }
        }
        n = block.indexOf('"', n);
        if (n === -1) return [];
        n++;
        let photo = block
            .substring(n, block.indexOf('"', n))
            .split(",")
            .pop()
            .trim()
            .split(" ")[0]
            .trim();
        return [photo];
    }

    getRate(block: string): {
        rating: number,
        quantity?: number
    } | undefined {
        let n = block.indexOf("דירוג:");
        if (n === -1) return undefined;
        n = block.indexOf(":", n);
        if (n === -1) return undefined;
        n++;
        const rateStr = block
            .substring(n, block.indexOf('"', n))
            .replace("Google", "")
            .replace("Tripadvisor", "")
            .replace("-", "")
            .trim();

        if (rateStr && rateStr.includes("/")) {
            return {
                rating: Number(rateStr.split('/')[0])
            };
        }
        return undefined;
    }

    getValue(block: string, key: string): string | undefined {
        let n = block.indexOf(key);
        if (n === -1) return undefined;
        n = block.indexOf(">", n);
        if (n === -1) return undefined;
        n++;
        return block.substring(n, block.indexOf("<", n));
    }

    extractPriority(arr: string[]): string {
        if (arr.join(",").includes("ספארי")) {
            // return TriplanPriority.must.toString();
            return "must";
        }
        return undefined;
        //return TriplanPriority.unset.toString();
    }

    extractCategory(arr: string[]): string {
        const categoryToKeywordMapping = {
            "CATEGORY.HOTELS": ["/hotel_category/"],
            "CATEGORY.ATTRACTIONS": ["/attraction/"],
            "CATEGORY.TOURISM": ["city-walk", "burj", "מסגד", "טיילת", "המרינה"],
            "CATEGORY.VIEWS": ["sky view", "תצפית", "dubai frame"],
            "CATEGORY.BARS_AND_NIGHTLIFE": ["בר הקרח", "lounge", "מופע לה פרל"],
            "CATEGORY.PARKS": ["פארק"],
            "CATEGORY.BEACHES": ["חוף "],
            "CATEGORY.BEACH_BARS": ["beach bar"],
        };

        let toReturn = "";
        Object.keys(categoryToKeywordMapping).forEach((category) => {
            arr.forEach((str) => {
                categoryToKeywordMapping[category].forEach((keyword) => {
                    if (str.indexOf(keyword) !== -1) {
                        toReturn = category;
                        return toReturn;
                    }
                });

                if (toReturn !== "") {
                    return toReturn;
                }
            });
            if (toReturn !== "") {
                return toReturn;
            }
        });
        return toReturn;
    }

    extractIcon(arr: string[]) {
        const keywordToIcon = {
            "רויאל": "⚜️",
            פרחים: "🌸",
            פרפרים: "🦋",
            גולף: "🏌️",
            "גלגל ענק": "🎡",
            דולפינריום: "🐬",
        };

        let toReturn = "";
        Object.keys(keywordToIcon).forEach((keyword) => {
            arr.forEach((str) => {
                if (str.indexOf(keyword) !== -1) {
                    toReturn = keywordToIcon[keyword];
                    return toReturn;
                }
            });
            if (toReturn !== "") {
                return toReturn;
            }
        });
        return toReturn;
    }

    async getItemsByUrl(more_info: string): Promise<any[]> {
        let baseUrl = "https://dubai.co.il/attraction/";
        let category;
        if (more_info.includes("/tours")) {
            category = "CATEGORY.TOURISM";
        }

        if (more_info.includes("/hotel_category")) {
            baseUrl = "https://dubai.co.il/hotel/";
            category = "CATEGORY.HOTELS";
        } else if (more_info.includes("/restaurant_category/")) {
            baseUrl = "https://dubai.co.il/restaurant"
            category = "CATEGORY.FOOD";
        } else if (more_info.includes("/bar_nightlife_category/")) {
            baseUrl = "https://dubai.co.il/bar_nightlife"
            if (more_info.includes("beach-clubs-in-dubai")) {
                category = "CATEGORY.BEACH_BARS";
            }
            else if (more_info.includes("clubs-in-dubai")) {
                category = "CATEGORY.CLUBS";
            }
            else {
                category = "CATEGORY.BARS_AND_NIGHTLIFE";
            }
        } else if (more_info.includes("shopping_category")) {
            baseUrl = "https://dubai.co.il/shopping/";
            category = "CATEGORY.SHOPPING";
            if (more_info.includes("markets")) {
                category = "CATEGORY.TOURISM";
            }
        }

        let destination = "Dubai";
        if (more_info.includes("attractions-in-abu-dhabi")) {
            destination = "Abu Dhabi";
        }

        let suffix = "";
        let engSuffix = "";
        if (more_info.includes("/kosher")) {
            suffix = " - כשר";
            engSuffix = " - Kosher";
        }

        // get page content
        const res = await axios.get(more_info);
        const pageContent = res.data;
        const htmlBlocks = pageContent
            .split(`<a href="${baseUrl}`)
            .filter((item, index) => {
                return index !== 0 && item[0] !== '"';
            });


        const items = htmlBlocks
            .map((block) => {
                const more_info = baseUrl + block.substring(0, block.indexOf('"'));
                const hebName = this.getValue(block, 'class="text-lg text-primary');
                const engName = this.getValue(block, '<div class="text-smaller');

                const name = [hebName + suffix, engName + engSuffix].filter(Boolean).join(" / ");
                const description = this.getValue(block, '<div class="pb-3 text');
                const rate = this.getRate(block);
                const images = this.getPhotos(block);

                if (name == "" || description == undefined) {
                    return;
                }

                if (name.toLowerCase().includes("abu dhabi")) {
                    destination = "Abu Dhabi";
                }

                const item = {
                    category: category ?? this.extractCategory([name, description, more_info]),
                    duration: "",
                    icon: this.extractIcon([name, description, more_info]),
                    location: undefined,
                    openingHours: undefined,
                    priority: this.extractPriority([name, description, more_info]),
                    destination: destination,
                    source: this.source,
                    videos: undefined,
                    name,
                    description,
                    more_info,
                    rate,
                    images,
                    isVerified: true,
                };
                return item;
            })
            .filter(Boolean);

        return items;
    }

    removeDuplicateItems(items: any[]): any[] {
        const ids = items.map((o) => o.name + o.source);
        const filtered = items.filter(
            ({ name, more_info }, index) => !ids.includes(name + more_info, index + 1)
        );
        return filtered;
    }

    async search({ destination, page = 1 }: SearchDto, user: User): Promise<SearchResults> {

        // todo complete
        const isFinished = true; // todo complete

        let allItems = [];
        const urls = [
            "https://dubai.co.il/attraction_tag/recommended-attractions-for-families/",
            "https://dubai.co.il/attraction_category/structures-in-dubai/",
            "https://dubai.co.il/attraction_category/amusement-parks-in-dubai/",
            "https://dubai.co.il/attraction_category/extreme-attractionscruises-in-dubai/",
            "https://dubai.co.il/attraction_category/cruises-in-dubai/",
            "https://dubai.co.il/attraction_category/tours-in-dubai-and-abu-dhabi/",
            "https://dubai.co.il/attraction_category/recreation-centers-in-dubai/",
            "https://dubai.co.il/attraction_category/beaches-in-dubai/",
            "https://dubai.co.il/hotel_category/resorts-in-dubai/",
            "https://dubai.co.il/hotel_category/hotels-in-dubai/",
            "https://dubai.co.il/restaurant_category/restaurants-in-dubai/",
            "https://dubai.co.il/restaurant_category/kosher-restaurants-in-dubai/",
            "https://dubai.co.il/bar_nightlife_category/beach-clubs-in-dubai/",
            "https://dubai.co.il/bar_nightlife_category/bars-in-dubai/",
            "https://dubai.co.il/bar_nightlife_category/clubs-in-dubai/",
            "https://dubai.co.il/shopping_category/malls-in-dubai/",
            "https://dubai.co.il/shopping_category/markets-in-dubai/",
            "https://dubai.co.il/attraction_category/attractions-in-abu-dhabi/",
        ];

        const promises = urls.map((url) => this.getItemsByUrl(url));

        // fix these
        await Promise.all(promises).then((results) => {
            // @ts-ignore
            allItems = results.flat();
        });

        // filtered results:
        const results = await this.removeDuplicateItems(allItems);

        // keep on db
        await this.poiService.upsertAll(results, user);

        return {
            nextPage: undefined,
            isFinished,
            results,
            source: this.source
        };
    }
}
