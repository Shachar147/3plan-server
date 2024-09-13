/**
 * Converts a time string into the "HH:MM" format.
 * Supports single values and ranges for hours, days, and minutes.
 *
 * Examples:
 * convertTime("1.5 hours");      // Outputs: "01:30"
 * convertTime("1.5 days");       // Outputs: "36:00"
 * convertTime("90 minutes");     // Outputs: "01:30"
 * convertTime("2 hours");        // Outputs: "02:00"
 * convertTime("0.5 days");       // Outputs: "12:00"
 * convertTime("45 minutes");     // Outputs: "00:45"
 * convertTime("4 - 7 hours");    // Outputs: "05:30" (Average of 4 and 7 hours)
 * convertTime("1.5 - 2.5 days"); // Outputs: "48:00" (Average of 1.5 and 2.5 days)
 * convertTime("30 - 90 minutes");// Outputs: "01:00" (Average of 30 and 90 minutes)
 *
 * @param {string} input - The input time string to convert.
 * @returns {string} - The converted time in "HH:MM" format.
 * @throws {Error} - Throws an error if the input format is invalid or if an unsupported unit is used.
 */
export function convertTime(input) {
    // Regular expression to match numbers with optional decimal and units
    const rangeMatch = input.match(/^([\d.]+)\s*-\s*([\d.]+)\s*(hours?|days?|minutes?)$/i);
    const singleMatch = input.match(/^([\d.]+)\s*(hours?|days?|minutes?)$/i);

    let averageValue, unit;

    if (rangeMatch) {
        // If the input is a range like "4 - 7 hours"
        const value1 = parseFloat(rangeMatch[1]);
        const value2 = parseFloat(rangeMatch[2]);
        averageValue = (value1 + value2) / 2;
        unit = rangeMatch[3].toLowerCase();
    } else if (singleMatch) {
        // If the input is a single value like "1.5 hours"
        averageValue = parseFloat(singleMatch[1]);
        unit = singleMatch[2].toLowerCase();
    } else {
        // return `${input} (invalid format)`;
        return undefined;
        // throw new Error("Invalid input format. Use 'X hours', 'X days', 'X minutes' or 'X - Y hours', etc.");
    }

    let totalMinutes;

    // Convert input to total minutes based on the unit
    switch (unit) {
        case "hour":
        case "hours":
            totalMinutes = averageValue * 60;
            break;
        case "day":
        case "days":
            totalMinutes = averageValue * 24 * 60;
            break;
        case "minute":
        case "minutes":
            totalMinutes = averageValue;
            break;
        default:
            // return `${input} (unsupported time unit)`;
            return undefined;
            // throw new Error("Unsupported time unit. Use 'hours', 'days', or 'minutes'.");
    }

    // Calculate hours and minutes from total minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    // Pad hours and minutes to ensure two digits and format the result as "HH:MM"
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function extractCategory(arr: string[]): string {

    const categoriesPriorities = [
        "CATEGORY.NATURE",
        "CATEGORY.GIMMICKS",
        "CATEGORY.MUSEUMS",
        "CATEGORY.ATTRACTIONS",
        "CATEGORY.DESSERTS",
        "CATEGORY.FOOD",
        "CATEGORY.TOURISM",
        "CATEGORY.VIEWS",
        "CATEGORY.BARS_AND_NIGHTLIFE",
        "CATEGORY.PARKS",
        "CATEGORY.CITIES",
        "CATEGORY.BEACH_BARS",
        "CATEGORY.BEACHES",
        "CATEGORY.HOTELS"
    ];

    const excludeKeywords = [
        "Business Lounge"
    ]

    const knownResturants = [
        "amazonico",
        "zuma",
        "McDonald's",
        "Subway",
        "Starbucks",
        "KFC",
        "Burger King",
        "Pizza Hut",
        "Dominos",
        "Domino's",
        "Panda Express",
        "Applebee's",
        "Shake Shack",
        "Cheesecake factory",
        "Vapiano",
        "Arcaffe",
        "Aroma Espresso Bar",
        "Café Amazon",
        "Café Café",
        "Caffè Nero",
        "Cofix",
        "Costa Cafe"
    ]

    if (knownResturants.find((k) => arr[0].includes(k))) {
        return "CATEGORY.FOOD";
    }

    if (arr[0].includes("Bike Tour")) {
        arr = [
            "Bike Tour"
        ];
    }

    if (arr[0].includes("Bus Transfer") || arr[0].includes("Shuttle") || arr[0].includes("Transportation Ticket") || arr[0].includes("Airport Transfer")) {
        return "CATEGORY.GENERAL";
    }

    if (arr[0].includes("Outlet") || arr[0] == "Dubai Mall" || arr[0] == "The Dubai Mall") {
        return "CATEGORY.SHOPPING";
    }

    const categoryToKeywordMapping = {
        "CATEGORY.GIMMICKS": [
            "glow in the dark",
            "glow in dark",
            "secret bar",
            "fairy tales",
            "Miracle Garden",
            "harry potter pub",
            "harry potter bar",
            "spongebob",
            "smurfs",
            "moomins",
            "secret pub",
            "Selfie Museum",
            "Museum of Selfies",
            "golf in the dark",
            "Hysteria Haunted Attraction",
            "beer spa",
            "convertible Prague sightseeing tour",
            "Flying Dress Photoshoot",
            "Hot Air Balloon Ride",
            "Sumo Entertainment Show",
            "Tuk Tuk City Tour",
            "Shark Cage Diving",
            "Haunted Pubs",
        ],
        "CATEGORY.GENERAL": [
            "Doha Private City Tour Create Your Own Itinerary",
            "מפראג: סיור לשוויץ הסקסונית והבוהמית",
        ],
        "CATEGORY.ATTRACTIONS": [
            "הרפתקאות באגי דיונה",
            "All Inclusive! Tulum Ruins, Tequila Tasting + Swim in 3 Cenotes in Small Group!",
            "סיור וספה וינטג'",
            "ברלין: מגדל הטלוויזיה מהיר כרטיס והזמנה למסעדה",
            "בורה בורה ביבשה ובים: ספארי 4WD ושנורקל",
            "מהו צ'י מין: טרק Can Gio Mangrove, אי הקופים",
            "Romantic Canal Cruise",
            "ספארי במדבר | טרקטורונים | עליית חול | טיול גמלים",
            "Private Couples Photography Session",
            "Sunset Boat Tour in Ibiza with All Inclusive",
            "Rope Trips Aventuras Radicais",
            "4WD Jeep Tours",
            "Bali Full Day The Gate of Heaven Tour by VW Safari Classic Car",
            "VW Safari Classic Car",
            "Outdoor Shooting Experience",
            "Helicopter tour",
            "Helicopter ride",
            "Airboat ride",
            "Polaris Slignshot rental",
            "Bike tour",
            "סיור רכב סילון",
            "Speedboat",
            "Helicopter Experience",
            "Speedboat Tour",
            "Studio Tour",
            "hiking",
            // "hikes",
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
            // "Walking Tour",
            "Canoeing",
            "Wine Tasting"
        ],
        "CATEGORY.NATURE": [
            "Waterfalls",
            // " hike ",
            "Niagara Falls",
            "forest",
            "picnic",
            "flowers garden",
            "forest",
            "mountains",
            "הר געש, שדות תה ואורז, מעיינות חמים",
            "Panoramic historical walking tour of Naples",
            "הלגונות והחופים",
        ],
        "CATEGORY.TOURISM": [
            "city-walk", "burj", "מסגד", "טיילת", "המרינה", "אייפל", "eifel", "souk", "שווקים", "Historical Tours", "old town", "windsor castle",
            "Pyramids of Giza", "ancient Egyptian", "Egyptian Antiquities", "Tour of Old Nice", "Walking Tour, in Nice", "Historical Stone town tour", "London: Buckingham Palace",
            "Private Tailor Made Tour", "Sagrada Familia", "La Sagrada Familia", "Walking Historic Highlights Tour", "סיור רגלי לקבוצות קטנות עם מדריך",
            "historical walking tour", "Private Full Day Tour: Ulun Danu Beratan Temple, Jatiluwih and Tanah Lot Temple", "Treblinka Tour",
            "Guided City Tour", "Private City Tour", "Castle Tour", "Churchil War Rooms", "London Landmarks", "White House Walking Tour", "Historic Shared Walking Tour",
            // "Walking Tour",
            "Mosque",
        ],
        "CATEGORY.VIEWS": ["sky view", "תצפית", "dubai frame", "Observatory"],
        "CATEGORY.BARS_AND_NIGHTLIFE": ["dance club", "lounge", "AnonymouS Bar", "rooftop bar", "Icebar", "Korean Drinking Games Night"],
        "CATEGORY.PARKS": ["פארק"],
        "CATEGORY.CITIES": ["עיירה", "עיירות"],
        "CATEGORY.BEACH_BARS": ["beach bar", "beach club"],
        "CATEGORY.BEACHES": ["beach "],
        "CATEGORY.MUSEUMS": ["Museum", "art museum", "Paris: Louvre", "Ripley's Believe it or not"],
        "CATEGORY.HOTELS": [
            "six senses",
            "sixsenses",
            // " hotel ",
            // " resort ",
            // "בית מלון",
            // "המלון",
            // "אתר נופש"
        ],
        "CATEGORY.DESSERTS": [
            'desserts',
            'קינוחים',
            'גלידה',
            'macaroons',
            'מקרונים',
            'cookie',
            'עוגייה',
            'ice cream',
        ],
        "CATEGORY.SHOPPING": [
            "Fashion Center",
            "Lacost",
            "Zara ",
            "Hollister",
            "Abercombie",
            "Chanel",
            "Calvin Klein",
            "Tommy Hilfiger",
            "Nike ",
            "Adidas",
            "Ralph Lauren",
        ],
        "CATEGORY.FOOD": [
            "traditional dishes",
            "cuisine", // מטבח
            "dishes from all over Greece",
            "סיור טעימות של אוכל רחוב",
            "פאלרמו: סיור טעימות של אוכל רחוב ושוק מקומי",
            "Wine Tour",
            "Food cooking class",
            "Cooking Class",
            "סיור טעימות", "Food tour",
            "restaurant", "cafe", "מסעדה", "chocolate", "croissants",
            "Pizza", "Pasta", "Hamburger", "Burger", "Sushi",
            "Brixton Market Tour with African and Caribbean Cuisine",
            "Brooklyn NYC Food & Walking Tour with a 5th Generation New Yorker",
            "Food markets",
            "Street Food Walking Tour",
            "Local Food Walking Tour",
            "Food Walking Tour",
            "Foody walking tour"
        ],
    };

    let matchedCategories: Record<string, number> = {};
    Object.keys(categoryToKeywordMapping).forEach((category) => {
        arr.forEach((str) => {

            excludeKeywords.forEach((k) => {
                str = str.replace(k, "");
            })

            categoryToKeywordMapping[category].forEach((keyword) => {
                if (str.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) {
                    matchedCategories[category] = matchedCategories[category] || 0;

                    if (str == keyword){
                        matchedCategories[category] += 100;
                    } else {
                        matchedCategories[category] += keyword.length;
                    }
                }
            });
        });

        // if (Object.keys(matchedCategories).length > 0){
        //     if (Object.keys(matchedCategories).length > 1) {
        //         console.log("hereee", matchedCategories, matchedCategories.sort((a, b) => categoriesPriorities.indexOf(a) - categoriesPriorities.indexOf(b))[0])
        //     }
        //     toReturn = matchedCategories.sort((a,b) => categoriesPriorities.indexOf(a) - categoriesPriorities.indexOf(b))[0];
        //     return matchedCategories[0]
        // }
    });


    if (Object.keys(matchedCategories).length == 0){
        return "";
    }

    if (matchedCategories["CATEGORY.GIMMICKS"]) {
        return "CATEGORY.GIMMICKS";
    }

    // Step 1: Find the highest score
    const highestScore = Math.max(...Object.values(matchedCategories));

    // Step 2: Filter categories with the highest score
    const topCategories = Object.keys(matchedCategories).filter(category => matchedCategories[category] === highestScore);

    // Step 3: Sort top categories by priority
    const bestCategory = topCategories.sort((a, b) => {
        return categoriesPriorities.indexOf(a) - categoriesPriorities.indexOf(b);
    })[0];

    // console.log(bestCategory);  // Output the category with the highest priority

    return bestCategory;
}