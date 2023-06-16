// https://api.woosmap.com/distance/distancematrix/json?origins=48.836,2.237&destinations=48.709,2.403|48.768,2.338|enc:gbxhHoo}M:|49.987,2.223&key={PUBLIC_API_KEY}

import {TravelMode} from "../common";

export async function matrix(origins: string[], destinations: string[], mode: TravelMode = "DRIVING") {

    const key = "woos-81a699ca-5082-3ffd-9f54-a684a4b82853";
    destinations = destinations.map((x) => x.replace(",","%2C"));
    origins = origins.map((x) => x.replace(",",'%2C'));
    const url = `https://api.woosmap.com/distance/distancematrix/json?key=${key}&origins=${origins.join("|")}&destinations=${destinations.join("|")}&mode=${mode.toLocaleLowerCase()}&duration=true`; // &language=en&units=metric&alternatives=false&method=time`;

    // const url = `https://api.woosmap.com/distance/time_distance_matrix/json?origins=${origins.join("|")}&destinations=${destinations.join("|")}&duration=true&key=${key}`

    const response = await fetch(url, {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,he;q=0.8",
            "sec-ch-ua": "\"Google Chrome\";v=\"113\", \"Chromium\";v=\"113\", \"Not-A.Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "Referer": "https://4n47q.csb.app/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    })

    const json = await response.json();

    const results = [];
    const errors = [];

    if (json.status == "OK") {

        json.rows.forEach((row, i) => {
            row.elements.forEach((element, j) => {

                const origin = origins[i];
                const destination = destinations[j];
                const distance = element["distance"];
                const duration = element["duration"];

                if (distance) {
                    results.push({
                        origin,  // should have been the address
                        distance: distance,
                        destination,  // should have been the address
                        duration: duration,
                        travelMode: mode,
                        from: origin,
                        to: destination
                    });
                } else {
                    errors.push({
                        errorText:
                            destination + " is not reachable by land from " + origin,
                        errorData: undefined,
                        origin, // should have been the address
                        distance: undefined,
                        destination, // should have been the address
                        duration: undefined,
                        travelMode: mode,
                        from: origin,
                        to: destination,
                    });
                }
            })
        })
    }

    return { results , errors };
}