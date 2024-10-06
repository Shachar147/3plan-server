import { Injectable } from '@nestjs/common';
import {ExtractInfoDto} from "./dto/extract-info.dto";
import axios from "axios";
import {sleep} from "../shared/utils";

@Injectable()
export class InfoExtractorService {

    async getFacebookJobId(facebookUrl: string): Promise<string> {
        // const data = `{"url":"https://www.facebook.com/groups/TheSecretOfHiddenHistory/permalink/3699589043614123/?mibextid=CTbP7E&paipv=0&eav=AfZ1WbqLtt8yLqdm1NQIWH_Nqxrzkr53eosp3S62hmTtrRVpjXeULnMV3kIem87MytA&_rdr"}`;
        const data = JSON.stringify({
            url: facebookUrl
        })

        const config = {
            headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9,he;q=0.8',
                'content-type': 'application/json;',
                'origin': 'https://publer.io',
                'priority': 'u=1, i',
                'referer': 'https://publer.io/',
                'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
            },
        };

        const response = await axios.post('https://app.publer.io/hooks/media', data, config);
        const jobId = response.data["job_id"];
        return jobId;
    }

    async getFacebookPhotos(facebookJobId: string, tryCount = 0): Promise<string[]> {
        const config = {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9,he;q=0.8',
                'origin': 'https://publer.io',
                'priority': 'u=1, i',
                'referer': 'https://publer.io/',
                'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
            }
        };

        const result = await axios.get(`https://app.publer.io/api/v1/job_status/${facebookJobId}`, config)
        if (result.data.status === 'working' && tryCount < 10) {
            await sleep(1000)
            return this.getFacebookPhotos(facebookJobId, tryCount + 1)
        }
        else if (tryCount >= 10){
            return [];
        }
        return result.data.payload.map((o) => o.path);
    }

    async extractFromFacebook(facebookUrl: string){

        const jobId = await this.getFacebookJobId(facebookUrl);
        const images = await this.getFacebookPhotos(jobId)

        const name = ""; // todo complete - extract
        const destination = undefined; // todo complete - extract
        const description = undefined; // todo complete - extract
        const more_info = facebookUrl;

        const category = "CATEGORIES.GENERAL"; // todo complete - try to extract?
        const duration = "01:00"; // todo complete based on category?
        const priority = 0; // unset
        const rate = undefined;
        const price = undefined;
        const currency = undefined;
        const location = undefined;

        return {
            name,
            destination,
            description,
            images,
            videos: [],
            source: "Facebook",
            more_info,
            duration,
            category,
            //
            icon: undefined, // ?
            openingHours: undefined, // ?
            priority,
            location, // ?
            rate,
            //
            // price,
            // currency: currency,
            // extra: {
            //     price,
            //     currency: currency,
            // }
        }
    }

    async extractInfo(extractInfoDto: ExtractInfoDto) {
        if (extractInfoDto.moreInfo.includes("facebook.com")) {
            return await this.extractFromFacebook(extractInfoDto.moreInfo);
        }
        return {};
    }
}
