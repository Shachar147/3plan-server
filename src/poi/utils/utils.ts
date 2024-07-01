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