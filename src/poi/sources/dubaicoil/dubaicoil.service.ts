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
            אטרקציות: ["/attraction/"],
            תיירות: ["city-walk", "burj", "מסגד", "טיילת", "המרינה"],
            תצפיות: ["sky view", "תצפית", "dubai frame"],
            "ברים חיי לילה": ["בר הקרח", "lounge", "מופע לה פרל"],
            פארקים: ["פארק"],
            חופים: ["חוף "],
            "ביץ׳ ברים": ["beach bar"],
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
        const baseUrl = "https://dubai.co.il/attraction/";

        // get page content
        const res = await axios.get(more_info);
        const pageContent = res.data;
        const htmlBlocks = pageContent
            .split('<a href="https://dubai.co.il/attraction/')
            .filter((item, index) => {
                return index !== 0 && item[0] !== '"';
            });

        const items = htmlBlocks
            .map((block) => {
                const more_info = baseUrl + block.substring(0, block.indexOf('"'));
                const hebName = this.getValue(block, 'class="text-lg text-primary');
                const engName = this.getValue(block, '<div class="text-smaller');

                const name = [hebName, engName].filter(Boolean).join(" / ");
                const description = this.getValue(block, '<div class="pb-3 text');
                const rate = this.getRate(block);
                const images = this.getPhotos(block);

                if (name == "" || description == undefined) {
                    return;
                }

                const item = {
                    category: this.extractCategory([name, description, more_info]),
                    duration: "",
                    icon: this.extractIcon([name, description, more_info]),
                    location: undefined,
                    openingHours: undefined,
                    priority: this.extractPriority([name, description, more_info]),
                    destination: this.destination,
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
            "https://dubai.co.il/attraction_category/recreation-centers-in-dubai/",
            "https://dubai.co.il/attraction_category/beaches-in-dubai/",
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
