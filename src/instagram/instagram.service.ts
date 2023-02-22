import {HttpService, Injectable} from '@nestjs/common';
import {TinderService} from "../integrations/tinder/tinder.service";
import {allPossibleCountries, mostPopularCities, saved_posts} from "./consts";

// todo: see if there's a way to set predefined values on db, so we'll have all of these tinder recommendations there built in even if we set up the respoitory on another computer

// todo: write algorithm that will scan instagram blogs and extract these urls, then send it to this function and add it automatically to triplan places finder.
// add column of "verified" that means we approved that the data there is correct. to be able to turn on/off flag that will suggest only verified places.

// todo: sync all of these with Yahav's API

// todo: try to add stuff from countries and cities from this list (based on priority) - most popular to least.

@Injectable()
export class InstagramService {

    constructor(
        private readonly httpService: HttpService,
        private tinderService: TinderService,
    ) {}

    extractCategory(arr: string[]): string {
        const categoryToKeywordMapping = {
            אטרקציות: ["hiking", "hikes", "dive", " Terme ", "skypool"],
            תיירות: ["city-walk", "burj", "מסגד", "טיילת", "המרינה","אייפל", "eifel"],
            תצפיות: ["sky view", "תצפית", "dubai frame"],
            "ברים חיי לילה": ["dance club", "lounge"],
            פארקים: ["פארק"],
            עיירות: ["עיירה", "עיירות"],
            חופים: ["beach "],
            "ביץ׳ ברים": ["beach bar"],
            "בתי מלון": ["six senses", "sixsenses", "hotel", "resort","בית מלון","המלון"],
            "אוכל": ["resturant", "cafe", "מסעדה", "chocolate", "croissants"]
        };

        let toReturn = "";
        Object.keys(categoryToKeywordMapping).forEach((category) => {
            arr.forEach((str) => {
                categoryToKeywordMapping[category].forEach((keyword) => {
                    if (str.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) {
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

    async fetchInstagramData(url: string) {
        console.log(`${url}/?__a=1&__d=dist`);

        const headers = {
            accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "en-US,en;q=0.9",
            "sec-ch-prefers-color-scheme": "light",
            "sec-ch-ua":
                '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"macOS"',
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "viewport-width": "864",
            cookie:
                'mid=Yv6rsQAEAAH6i6rBkagmMpfkBqgb; ig_did=25DACFE2-36AE-4A8F-A99A-0D85D581B9FA; fbm_124024574287414=base_domain=.instagram.com; datr=hlL_YiP9diGRpySL-flsFr_Y; shbid="3269\\054245922250\\0541707586583:01f791a1f394feddee6b389bef1c4e5d053da3f939f4db4952bb184030baf976eb0106fb"; shbts="1676050583\\054245922250\\0541707586583:01f70fa91feb734da6d99d0a890d1e1ec4b68f037c3c8a6146a19841cf9d8533225f5e7a"; dpr=2; fbsr_124024574287414=ZaEwjOwGelCzo5j2gb1ZUSEG6yRFWvqdveWRG-1t0Os.eyJ1c2VyX2lkIjoiMTM2OTQwMTk3MiIsImNvZGUiOiJBUUQtcTZCVDZCeV93c2xUbkhlektKbm5Ubm9ka1JPX3hxOXRRemNlYk92VDcyMU8zdW1YNUNMY3YwVUVqMHdRZi1FMWo0NHdDaFhKRGs2Z3Q1ZFFsUFFNSXk3dDk4ZjczT2NqclVEeTMzeFdrbjJNSUlwczBGZkl2dUZXVElMb01OUVNSTkloQ2dvaGlPT21kR1NqOGkxMmV5bEkwSWtSWFhvbUxPenJmTW1uYWIxM2lwYlpOcFBZdTlBWHJ1YzNPOEJqdXhISi1ZcUI5Q2s4MGlNa0wySDEzOWk5ZU5RVmxfc2hSSGtONWxNUGhxb2lVRzdFOWtzdDlyeFMwcHhieml4dndfTU5odzZ5T2FuMmVRU3RJX2szdGVSaW55YWNyQXpnUnBlVmVsQ0hQZWRqb0RwQlBMejkyUVJuOF9ValNtX25GdWRvcUdyamdiZGtIWDRqVmg3NUxSNkZRVXJFTTM5MWZta2J4Q29XdWciLCJvYXV0aF90b2tlbiI6IkVBQUJ3ekxpeG5qWUJBR0NtWkJqenBBYjJpYWhSU0ZhVWF0QmZsTzU4ZnhqNnFLU1pBcnpDWkJIcHlobFNUdzk4eHphNTlCcGJTek5mTzNaQnpaQ2oweVJyNVpBT2tZc3J3Znl3RlpDZFhGSEFoS2FmMzhReTN0UWFtWHhIUXRHYXBTT0JvM2VxR1JuTnhXRVZaQ09GOTdteU9KS3dIdDNFeVlQaVpDTmcxbEowcFlpSWsybUVWSEN2WkMiLCJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTY3NjE1NDY2M30; fbsr_124024574287414=ZaEwjOwGelCzo5j2gb1ZUSEG6yRFWvqdveWRG-1t0Os.eyJ1c2VyX2lkIjoiMTM2OTQwMTk3MiIsImNvZGUiOiJBUUQtcTZCVDZCeV93c2xUbkhlektKbm5Ubm9ka1JPX3hxOXRRemNlYk92VDcyMU8zdW1YNUNMY3YwVUVqMHdRZi1FMWo0NHdDaFhKRGs2Z3Q1ZFFsUFFNSXk3dDk4ZjczT2NqclVEeTMzeFdrbjJNSUlwczBGZkl2dUZXVElMb01OUVNSTkloQ2dvaGlPT21kR1NqOGkxMmV5bEkwSWtSWFhvbUxPenJmTW1uYWIxM2lwYlpOcFBZdTlBWHJ1YzNPOEJqdXhISi1ZcUI5Q2s4MGlNa0wySDEzOWk5ZU5RVmxfc2hSSGtONWxNUGhxb2lVRzdFOWtzdDlyeFMwcHhieml4dndfTU5odzZ5T2FuMmVRU3RJX2szdGVSaW55YWNyQXpnUnBlVmVsQ0hQZWRqb0RwQlBMejkyUVJuOF9ValNtX25GdWRvcUdyamdiZGtIWDRqVmg3NUxSNkZRVXJFTTM5MWZta2J4Q29XdWciLCJvYXV0aF90b2tlbiI6IkVBQUJ3ekxpeG5qWUJBR0NtWkJqenBBYjJpYWhSU0ZhVWF0QmZsTzU4ZnhqNnFLU1pBcnpDWkJIcHlobFNUdzk4eHphNTlCcGJTek5mTzNaQnpaQ2oweVJyNVpBT2tZc3J3Znl3RlpDZFhGSEFoS2FmMzhReTN0UWFtWHhIUXRHYXBTT0JvM2VxR1JuTnhXRVZaQ09GOTdteU9KS3dIdDNFeVlQaVpDTmcxbEowcFlpSWsybUVWSEN2WkMiLCJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTY3NjE1NDY2M30; csrftoken=dICynEu3RTFV1DpCVbjCqi81i3nd6yCV; ds_user_id=58197136611; sessionid=58197136611%3Ah0Oe4RevJqCDqb%3A7%3AAYezfSO5hjP7sfT0EMHbXD15521BiRMQi0yTT3woFA; rur="LDC\\05458197136611\\0541707691137:01f7d74b3b699845c233c1e6035f6b28d2e367a99717aa528ef35da9e9733cb7ccdad52c"',
        };

        const headers2 = {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,he;q=0.8",
            "sec-ch-prefers-color-scheme": "dark",
            "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Google Chrome\";v=\"110\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "viewport-width": "1792",
            "x-asbd-id": "198387",
            "x-csrftoken": "YbfEZK7ax95lw6nGik1t4kvWd4SviAmq",
            "x-ig-app-id": "936619743392459",
            "x-ig-www-claim": "hmac.AR3x2d6jh13ZgBIge-xDYkOvGvDWfU2VrwoBIW30TgIMaVRH",
            "x-requested-with": "XMLHttpRequest",
            cookie: "ig_did=BBD89C83-DD8E-4810-A8EE-7D399DC8B19F; ig_nrcb=1; mid=Y-Lo4wAEAAGwpLDDhM5KaBCtLaPU; datr=4ujiY9Fbzzxjwu03nWbUq1q0; fbm_124024574287414=base_domain=.instagram.com; dpr=2; shbid=\"3269\\054245922250\\0541708192473:01f7b26f461d5f9e96d6475452b4ee629bf59c8b4891a169fb3006b10d4d025664ac15e7\"; shbts=\"1676656473\\054245922250\\0541708192473:01f798e4d3046421a10a3f40a5339957b6335203e5523146878aa5da017fb09b0b1cdfff\"; fbsr_124024574287414=HN6O3Dg-_GxzjWssI7dYUrm4C4k17kJlmnLDBppjcHc.eyJ1c2VyX2lkIjoiMTM2OTQwMTk3MiIsImNvZGUiOiJBUUFNVG90bTRXZmlRdXdaN1JWa1o4dU1SUnhHUFdDNktKZkt6WF9HekhMS0g2N2NzeXgwTGZaZ3loZ1dfNnM3V1BWblVOTzN0M083VWdXSXVCRng2bVViY250RGZ1bjNMdkVhVnNLTno0S2xoX09hVlF0NVNXSXdHWHdlOURlRE9TcDgtaWJGTGRhMGdEWWdFNWR0MHFWbDA0TjZjTEJtQjl2OWJtbGxmcVJnSkhKaGJTWkhIWENnY0thekpnZTZpbjNHdGJPSGlNcVpCaWRkNGpNUzNDay1qVXBjT053YjJQdVMwRy16VjgzNmQ3b3pjMGRoTW1ta2dEdVdoNnZrdnIyaFZjT0tMVzVlQWFiTE8wSzl5cnI4b3JPaENjenNWaVpFejdzakNySkIwaGZVMFNhclNqcTdhVTBzYWN0M2pRcjNuRjNkV0U2RFk0OTRRR0txSy1DNXNvRmFWRDBoSVVyXzdfS3dyaWlmS3ciLCJvYXV0aF90b2tlbiI6IkVBQUJ3ekxpeG5qWUJBSTFCanlGWkNZYTg2Rkl0ckZORmZpUzM0MG9CenZGcUNvVUtzbU1rMlJJSGl1UlFhWFNxNmlkRFpCaHhSb2I2OWhOTDF1cXZNZ2Y4RjI4Qm5MMUtaQkNKRm45bkVBcDFTQ1c2S0dBbmIwMEdUWVpDNzlHVEVsZWpxZjdKYjhTOFU2dUhWMDU5VnF2T05xbVZvbEN4UVVyTEhJcXU4U0dTNmk3QXVoM0UiLCJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTY3Njc0ODYxMX0; fbsr_124024574287414=HN6O3Dg-_GxzjWssI7dYUrm4C4k17kJlmnLDBppjcHc.eyJ1c2VyX2lkIjoiMTM2OTQwMTk3MiIsImNvZGUiOiJBUUFNVG90bTRXZmlRdXdaN1JWa1o4dU1SUnhHUFdDNktKZkt6WF9HekhMS0g2N2NzeXgwTGZaZ3loZ1dfNnM3V1BWblVOTzN0M083VWdXSXVCRng2bVViY250RGZ1bjNMdkVhVnNLTno0S2xoX09hVlF0NVNXSXdHWHdlOURlRE9TcDgtaWJGTGRhMGdEWWdFNWR0MHFWbDA0TjZjTEJtQjl2OWJtbGxmcVJnSkhKaGJTWkhIWENnY0thekpnZTZpbjNHdGJPSGlNcVpCaWRkNGpNUzNDay1qVXBjT053YjJQdVMwRy16VjgzNmQ3b3pjMGRoTW1ta2dEdVdoNnZrdnIyaFZjT0tMVzVlQWFiTE8wSzl5cnI4b3JPaENjenNWaVpFejdzakNySkIwaGZVMFNhclNqcTdhVTBzYWN0M2pRcjNuRjNkV0U2RFk0OTRRR0txSy1DNXNvRmFWRDBoSVVyXzdfS3dyaWlmS3ciLCJvYXV0aF90b2tlbiI6IkVBQUJ3ekxpeG5qWUJBSTFCanlGWkNZYTg2Rkl0ckZORmZpUzM0MG9CenZGcUNvVUtzbU1rMlJJSGl1UlFhWFNxNmlkRFpCaHhSb2I2OWhOTDF1cXZNZ2Y4RjI4Qm5MMUtaQkNKRm45bkVBcDFTQ1c2S0dBbmIwMEdUWVpDNzlHVEVsZWpxZjdKYjhTOFU2dUhWMDU5VnF2T05xbVZvbEN4UVVyTEhJcXU4U0dTNmk3QXVoM0UiLCJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTY3Njc0ODYxMX0; csrftoken=YbfEZK7ax95lw6nGik1t4kvWd4SviAmq; ds_user_id=58007341157; sessionid=58007341157%3AVpMfuaQsHLyjpm%3A7%3AAYeYu6LFLeTTQ9tS5HQeYDRDCjLOMm15LX99S7Xf5Q; rur=\"CLN\\05458007341157\\0541708284767:01f757b20784999326f796818ca73accde020d7b41794d0a61b5d54debdddbc7cab1b6aa\"",
        };

        return this.httpService
            .get(`${url}/?__a=1&__d=dist`, {
                headers: headers2,
            })
            .toPromise();
    }

    /***
     * get specific instagram post data
     *
     * @param url - instagram post url
     */
    async getInstagramData(url: string): Promise<any> {
        if (url.endsWith("/")) {
            url = url.substring(0, url.length - 1);
        }

        const content: any = await this.fetchInstagramData(url);

        // console.log(content.data.items[0]);

        if (content?.data) {
            const data =
                content?.data?.graphql?.shortcode_media ?? content.data.items[0];

            // return data;

            return this.scrapeInstagramJSON(data, url);
        }
        return {};
    }

    scrapeInstagramJSON(data: any, url?: string) {

        const findDestination = (description: string, location?: any) => {
            let result = "N/A";

            // exceptions
            const specialExceptions = {
                Germany: ["allgäu"],
            };

            [...allPossibleCountries, ...mostPopularCities].forEach((country) => {
                if (
                    description &&
                    description.toLowerCase().indexOf(country.toLowerCase()) !== -1
                ) {
                    result = country;
                    return result;
                } else if (
                    location &&
                    JSON.stringify(location)
                        .toLowerCase()
                        .indexOf(country.toLowerCase()) !== -1
                ) {
                    result = country;
                    return result;
                }
            });

            if (result === "N/A"){
                Object.keys(specialExceptions).forEach((destination) => {
                    if (description &&
                        description.toLowerCase().indexOf(destination.toLowerCase()) !== -1) {
                        result = destination;
                        return destination;
                    } else if (location &&
                        JSON.stringify(location)
                            .toLowerCase()
                            .indexOf(destination.toLowerCase()) !== -1) {
                        result = destination;
                        return destination;
                    }
                });
            }

            return result;
        };

        let {
            shortcode,
            carousel_media,
            display_url,
            is_video,
            edge_media_to_caption,
            location,
            video_url,
            video_play_count,
            video_view_count,
            edge_sidecar_to_children,
        } = data;
        let description = edge_media_to_caption?.["edges"]?.[0]?.["node"]?.text;

        // video
        let videos = undefined;
        if (is_video) {
            const video = {
                video_url,
                video_play_count,
                video_view_count,
            };
            videos = [video];
        }

        // image
        let images = [display_url];

        // combo
        if (edge_sidecar_to_children) {
            const comboItems = edge_sidecar_to_children.edges
                ?.map((iter) => iter?.node)
                .filter(Boolean);

            images = edge_sidecar_to_children
                ? comboItems
                    .filter((item) => !item.is_video)
                    .map((item) => item.display_url)
                : [display_url];

            videos = comboItems
                .filter((item) => item.is_video)
                .map((item) => {
                    const { video_url, video_play_count, video_view_count } = item;
                    return { video_url, video_play_count, video_view_count };
                });
        } else if (carousel_media) {
            carousel_media.forEach((iter) => {
                const { image_versions2 } = iter;

                display_url = image_versions2?.["candidates"]?.[0]?.["url"];
                images.push(display_url);

                const video = iter?.video_versions?.[0]?.["url"];
                videos = videos || [];
                videos.push(video);
            });

            videos = videos.filter(Boolean);
            images = images.filter(Boolean);
            is_video = videos.length > 0;
        }
        // extract here
        else if (!shortcode) {
            const { code, image_versions2 } = data;
            shortcode = code;

            display_url = image_versions2?.["candidates"]?.[0]?.["url"];
            images = [display_url].filter(Boolean);

            description = data?.caption?.text ?? "";

            const video = data?.video_versions?.[0]?.["url"];
            videos = [video].filter(Boolean);

            is_video = videos.length > 0;
        }

        if (!url){
            url = `https://www.instagram.com/p/${shortcode}`;
        }

        return {
            name: url,
            more_info: url,
            shortcode,
            images,
            videos,
            display_image: display_url,
            is_video,
            description,
            location,
            destination: findDestination(description, location),
            source: "Instagram",
            category: this.extractCategory([description].filter(Boolean))
        };
    }

    async postData(createMode, results, createdData, downloadMedia:boolean = true) {
        if (createMode && results.filter(Boolean).length > 0) {
            results.filter(Boolean).forEach((x) => x.description = x.description || "");
            const response = await this.tinderService.createBulk(results, downloadMedia);
            const totals = response?.data?.totals;
            createdData.totals.created += totals?.created ?? 0;
            createdData.totals.updated += totals?.updated ?? 0;
            createdData.totals.errors += totals?.errors ?? 0;
            createdData.totals.downloadedImages = createdData.totals.downloadedImages || 0;
            createdData.totals.downloadedVideos = createdData.totals.downloadedVideos || 0;
            createdData.totals.downloadedImages +=  response?.data?.downloaded?.images ?? 0;
            createdData.totals.downloadedVideos +=  response?.data?.downloaded?.videos ?? 0;

            const created = response?.data?.created ?? [];
            const updated = response?.data?.updated ?? [];
            const errors = response?.data?.errors ?? [];
            createdData.created = [...createdData.created, ...created];
            createdData.updated = [...createdData.updated, ...updated];
            createdData.errors = [...createdData.errors, ...errors];
            createdData.downloaded = response?.data?.downloaded ?? {};
        }
        return createdData;
    }

    /***
     * go over an array of predefined instagram posts, get theirs data and save it.
     * @param createMode - should we also create each item on our db?
     */
    async getSavedPostsData(createMode: boolean = false) {

        let data = saved_posts;

        const maxItems = 2;
        const maxInParallel = 2;

        data = data.slice(0, Math.min(data.length, maxItems));

        let allFailed = [];
        let allResults = [];
        let currPromises = [];

        let createdData = {
            totals: {
                created: 0,
                updated: 0,
                errors: 0,
                downloaded: {}
            },
            created: [],
            updated: [],
            errors: []
        }

        for (let i = 0; i < data.length; i++) {
            console.log(`${i + 1}/${data.length}...`);
            const promise = this.getInstagramData(data[i]).catch((error) => {
                allFailed.push({
                    url: error?.config?.url,
                    error: error?.message,
                });
            });
            currPromises.push(promise);
            if (currPromises.length === maxInParallel) {
                const results = await Promise.all(currPromises).catch((error) => {
                    allFailed.push({
                        url: error?.config?.url,
                        error: error?.message,
                    });
                    return [];
                }) ?? [];
                allResults.push(...results);

                if (createMode){
                    createdData = await this.postData(createMode, results, createdData)
                }

                // await new Promise((resolve) => { setTimeout(resolve, 1000) });
                currPromises = [];
            }
        }

        const results = await Promise.all(currPromises) ?? [];
        if (createMode){
            createdData = await this.postData(createMode, results, createdData)
        }
        allResults.push(...results);


        try {
            const hash = {};
            allResults.forEach((x) => {
                x.destination = x.destination || "N/A";
                hash[x.destination] = hash[x.destination] || 0;
                // hash[x.destination].push(x);
                hash[x.destination]++;
            });
            console.log(hash);
        } catch {}

        return {
            total: allResults.length,
            totalSucceeded: allResults.length - allFailed.length,
            totalFailed: allFailed.length,
            results: allResults.filter(Boolean),
            errors: allFailed,
            createdData
        };
    }

    /***
     * create instagram saved posts data
     */
    async createInstagramSavedPostsData(){
        return this.getSavedPostsData(true);
    }

    async createInstagramDataFromJSON(itemsJSON: any, downloadMedia: boolean = true){
        const results = itemsJSON?.items?.map((item) => this.scrapeInstagramJSON(item));
        let createdData = {
            totals: {
                created: 0,
                updated: 0,
                errors: 0
            },
            created: [],
            updated: [],
            errors: []
        }
        createdData = await this.postData(true, results, createdData, downloadMedia)
        return createdData;
    }

    async deleteInstagramData(){
        // todo complete
    }

    async scrapeInstagramProfile(userId: string): Promise<CreateInstagramItemsResult> {
        // travel bloggers
        // https://www.instagram.com/madiaubakirov/?hl=en -> 29859324
        // https://www.instagram.com/momentsofgregory/ -> 6367920068
        // https://www.instagram.com/_marcelsiebert/ -> 277627304
        // https://www.instagram.com/jeremyaustiin/ -> 22767954
        // https://www.instagram.com/or.zano/ -> travel inspirations -> 2961005690
        // https://www.instagram.com/judit.bar.dimri/-> 216755086
        const baseUrl = `https://www.instagram.com/api/v1/feed/user/${userId}/?count=120`;
        return await this.recursivelyScrapePage(baseUrl, 1);
    }

    async recursivelyScrapePage(baseUrl: string, reqCount: number, max_id?: string) {
        const headers = {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9,he;q=0.8',
            'sec-ch-prefers-color-scheme': 'dark',
            'sec-ch-ua': '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'viewport-width': '1792',
            'x-asbd-id': '198387',
            'x-csrftoken': 'YbfEZK7ax95lw6nGik1t4kvWd4SviAmq',
            'x-ig-app-id': '936619743392459',
            'x-ig-www-claim': 'hmac.AR0NLejJOielzYRs_gl0g2da4JqbJHCBR6dY4RYD3Ls4f9I3',
            'x-requested-with': 'XMLHttpRequest',
        };

        const headers2 = {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,he;q=0.8",
            "sec-ch-prefers-color-scheme": "light",
            "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Google Chrome\";v=\"110\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "viewport-width": "1792",
            "x-asbd-id": "198387",
            "x-csrftoken": "YbfEZK7ax95lw6nGik1t4kvWd4SviAmq",
            "x-ig-app-id": "936619743392459",
            "x-ig-www-claim": "hmac.AR0NLejJOielzYRs_gl0g2da4JqbJHCBR6dY4RYD3Ls4f7ha",
            "x-requested-with": "XMLHttpRequest"
        };

        const headers3 = {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9,he;q=0.8',
            'sec-ch-prefers-color-scheme': 'dark',
            'sec-ch-ua': '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'viewport-width': '1792',
            'x-asbd-id': '198387',
            'x-csrftoken': 'YbfEZK7ax95lw6nGik1t4kvWd4SviAmq',
            'x-ig-app-id': '936619743392459',
            'x-ig-www-claim': 'hmac.AR0NLejJOielzYRs_gl0g2da4JqbJHCBR6dY4RYD3Ls4f9I3',
            'x-requested-with': 'XMLHttpRequest',
        };

        const fetchUrl = max_id ? `${baseUrl}&max_id=${max_id}` : baseUrl;
        console.log("fetching ", fetchUrl, "...")
        const response: any = await fetch(fetchUrl, {
            headers: headers,
            // referrer: profileUrl,
            referrerPolicy: 'strict-origin-when-cross-origin',
            body: null,
            method: 'GET',
            // mode: 'cors',
            credentials: 'include',
        });
        const json = await response.json()
        const result: any = await this.createInstagramDataFromJSON(json, true);
        console.log(`result #${reqCount}`, result.totals);

        if (json['more_available'] && json['next_max_id']) {
            const subResult: CreateInstagramItemsResult = await this.recursivelyScrapePage(baseUrl, reqCount+1, json['next_max_id']);
            result.totals.created += subResult.totals.created ?? 0;
            result.totals.updated += subResult.totals.updated ?? 0;
            result.totals.errors += subResult.totals.errors ?? 0;
            result.totals.downloadedImages += subResult.totals.downloadedImages ?? 0;
            result.totals.downloadedVideos += subResult.totals.downloadedVideos ?? 0;

            result.created.push(...(subResult.created ?? []));
            result.updated.push(...(subResult.updated ?? []));
            result.errors.push(...(subResult.errors ?? []));

            result.downloaded.images += subResult.downloaded.images ?? 0;
            result.downloaded.videos += subResult.downloaded.videos ?? 0;
        }

        return result;
    }
}

export type CreateInstagramItemsResult = {
    totals: {
        created: number;
        updated: number;
        errors: number;
        downloadedImages: number;
        downloadedVideos: number;
    };
    created: any[];
    updated: {
        id: number;
        name: string;
    }[];
    errors: any[];
    downloaded?: {
        images: number;
        videos: number;
    };
};

