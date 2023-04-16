export class GooglePricesService {

    getRequestPrice(action: string, numOfElements: number = 1): number {
        switch (action) {
            case 'google_map:place_searched':
                // https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
                return 0.00283;
            case 'google_map:rendered':
                // https://developers.google.com/maps/billing-and-pricing/pricing#dynamic-maps
                return 0.007;
            case 'google_map:place_changed':
                // https://developers.google.com/maps/billing-and-pricing/pricing#query-ac-per-request
                return 0.017;
            case 'google_map:distance_matrix_request':
                return 0.01 * numOfElements;
            default:
                return 0;
        }
    }

}