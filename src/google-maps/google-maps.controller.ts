import { Controller, Get } from "@nestjs/common";
import { LatLngLiteral, TravelMode } from "@googlemaps/google-maps-services-js";
import { GoogleMapsService } from "./google-maps.service";
import {GraphHopperService} from "./open-street-map.service";

@Controller("google-maps")
export class GoogleMapsController {
  constructor(
      private readonly googleMapsService: GoogleMapsService,
      private readonly openStreetMapService: GraphHopperService
  ) {}

  @Get()
  async getRoutes(): Promise<any> {
    const locations: LatLngLiteral[] = [
      { lat: 46.62147979999999, lng: 8.030329199999999 }, // "Boutique Hotel Glacier Grindelwald",
      { lat: 46.6192393, lng: 8.005545999999999 }, // "The aespen hotel Grindelwald",
      { lat: 46.62435799999999, lng: 8.042304999999999 }, // "Hotel Steinbock Grindelwald",
      { lat: 46.623195, lng: 8.038451 }, // "Hotel Restaurant Spinne Grindelwald",
      { lat: 46.6335708, lng: 7.850828699999998 }, // "Berner Oberland - דשא ונהר יפה",
      { lat: 46.7708305, lng: 8.423121 }, // "הר טיטליס - לברר כמה עולה - ",
      { lat: 46.6189664, lng: 8.0058389 }, // "Restaurant Aspen",
      { lat: 46.62148639999999, lng: 8.0303714 }, // "Restaurant Glacier - להחליט אם רוצים ולהזמין",
      // { lat: 46.6863481, lng: 7.863204899999999 }, // "Panorama Resturant Harder Kulum",
      // { lat: 47.0520477, lng: 8.306913400000001 }, // "Starbucks Luceren",
      // { lat: 46.686485, lng: 7.856907000000001 }, // "La Terrasse Interlaken",
      // { lat: 46.68512779999999, lng: 7.855118 }, // "Vanini Swiss chocolate 1871 Interlaken",
      // { lat: 47.3724628, lng: 8.5457044 }, // "Nike Zurich",
      // { lat: 47.3742448, lng: 8.5434135 }, // "Timberland Zurich",
      // { lat: 47.2833786, lng: 9.414359 }, // "Äscher cliff restaurant",
      // { lat: 46.6134344, lng: 8.396326799999999 }, // "Rhone Glacier - לברר איך מגיעים",
      // { lat: 46.6958354, lng: 7.7212158 }, // "Cruise on Lake Thun",
      // { lat: 46.7179666, lng: 7.707886199999999 }, // "Sigriswil Panorama Bridge - גשר באינטרלאקן",
      // { lat: 46.73478249999999, lng: 8.026817900000001 }, // "Giessbach Falls",
      // { lat: 46.72674259999999, lng: 7.9674729 }, // "Kayak on Lake Brienz",
      // { lat: 46.7132352, lng: 7.965887399999999 }, // "Iseltwald Castle טירה",
      // { lat: 46.669444, lng: 8.023333000000001 }, // "אגם Bachalpsee",
      // { lat: 46.8652144, lng: 8.814762300000002 }, // "Altdorf Waterfall",
      // { lat: 47.0521702, lng: 8.3074126 }, // "Hotel Des Alpes צ׳ק אאוט",
      // { lat: 47.04792700000001, lng: 8.313578500000002 }, // "Radisson Blue Hotel Luceren",
      // { lat: 46.37795139999999, lng: 7.6254684 }, // "ספא Leukerbad",
      // { lat: 47.4612352, lng: 8.553497600000002 }, // "טיסה LY 344 ב21:25 מציריך לישראל",
      // { lat: 47.0529425, lng: 8.3045973 }, // "Tresor Luceren",
      // { lat: 47.074257, lng: 8.287094 }, // "Zara Luceren ",
      // { lat: 47.3728118, lng: 8.532682199999998 }, // "Tales Bar Zurich",
      // { lat: 47.3793008, lng: 8.532178 }, // "Gypsy rose zurich - בר סודי",
      // { lat: 47.37448560000001, lng: 8.522811399999998 }, // "La Taquería Zurich- נאצוס",
      // { lat: 47.0507315, lng: 8.3069259 }, // "Confiserie Kuerman",
      // { lat: 47.3767682, lng: 8.540171299999999 }, // "Starbucks Zurich",
      // { lat: 47.35849770000001, lng: 8.5228671 }, // "Vapiano Zurich",
      // { lat: 46.99481830000001, lng: 8.4030131 }, // "וילה הוניג (ליד לוצרן) - להזמין",
      // { lat: 47.0516489, lng: 8.307535099999999 }, // "Luzern Old Town",
      // { lat: 47.0548787, lng: 8.3119655 }, // "Amorino Luceren גלידה וקינוחים",
      // { lat: 46.6233853, lng: 8.039741 }, // "Avocado Bar Grindelwald",
      // { lat: 47.0482417, lng: 8.3055831 }, // "the Penthouse Bar, Luceren",
      // { lat: 46.62348, lng: 8.03811 }, // "Barry’s Grindelwald",
      // { lat: 47.3750984, lng: 8.540432599999999 }, // "Wow museum Zurich - כמו מוזיאון הסלפי",
      // { lat: 47.3779341, lng: 8.5377032 }, // "Laderech Zurich",
      // { lat: 46.7015402, lng: 8.232569300000002 }, // "רכבת הרים Grimselwelt Gelmerbahn - פתוח רק עד 11:30",
      // { lat: 46.68013, lng: 8.15357 }, // "Rosenlaui נהר יפה כזה",
      // { lat: 46.5935058, lng: 7.9090981 }, // "Lauterbrunnen",
      // { lat: 46.5896276, lng: 7.9052264 }, // "Staubbach Waterfall",
      // { lat: 46.5465167, lng: 7.8900416 }, // "גימלוולד - כפר אלפי ציורי",
      // { lat: 46.6305349, lng: 8.062760599999999 }, // "Bus Stop Bar - בר במתחם אוטובוסים - נסגר בשש",
      // { lat: 46.6234741, lng: 8.040753400000002 }, // "c und m Cafe Bar Resturant",
      // { lat: 46.6611009, lng: 8.0526454 }, // "נקודת תצפית פירסט קליף",
      // { lat: 46.6251893, lng: 8.0294857 }, // "מסעדת בלדוור - להזמין",
      // { lat: 46.62516530000001, lng: 8.029554599999999 }, // "מלון בלדוור האייקוני",
      // { lat: 46.6238043, lng: 8.0416981 }, // "Sunstar Hotel Grindelwald",
      // { lat: 46.6890601, lng: 7.857335900000002 }, // "Casino Kursaal Interlaken",
      // { lat: 46.4997355, lng: 7.548165 }, // "הנדנדה הענקית באדלבודן",
      // { lat: 46.68810360000001, lng: 7.862566700000002 }, // "Hotel Du Nord Interlaken",
      // { lat: 47.3756117, lng: 8.539569399999998 }, // "הילטון ציריך - להזמין",
      // { lat: 46.5573294, lng: 7.835221100000001 }, // "פסגת שילטהורן - נסגר בחמש - Schilthorn - המסעדה המסתובבת",
      // { lat: 46.55944239999999, lng: 7.892668899999999 }, // "הליכה מGimmelwald ל Muren",
      // { lat: 47.0136401, lng: 8.4371598 }, // "אגם לוצרן",
      // { lat: 46.7197751, lng: 8.209125300000002 }, // "Aare gorge canton Bern נהר יפה כזה ",
      // { lat: 46.71153349999999, lng: 8.215036699999999 }, // "קניון אארה / aareschlucht",
      // { lat: 47.051766, lng: 8.304905 }, // "Fondue House Du Pong Lucerne",
      // { lat: 46.5324482, lng: 7.664762899999999 }, // "אגם Blausee",
      // { lat: 47.4370227, lng: 8.571763800000001 }, // "צ׳ק אין במלון הילטון בציריך - להזמין",
      // { lat: 46.69732469999999, lng: 7.851655999999998 }, // "Harder Kulm - תצפית",
      // { lat: 47.05842630000001, lng: 8.310915099999999 }, // "Lion Monument",
      // { lat: 47.05291460000001, lng: 8.305649999999998 }, // "Tommy Hilfiger Luceren",
      // { lat: 46.65862679999999, lng: 8.065208 }, // "First Mountain Karts - קרטינג (כנראה סגור)",
      // { lat: 46.65929000000001, lng: 8.055147999999999 }, // "First Flier - אומגה (נפתח ב11)",
      // { lat: 46.6594906, lng: 8.053572299999999 }, // "Berggasthaus First",
      // { lat: 47.3749425, lng: 8.5395678 }, // "Black Tap Zurich המבורגרים",
      // { lat: 47.37488, lng: 8.538242 }, // "Sephora Zurich",
      // { lat: 47.3729388, lng: 8.538558199999999 }, // "Lacoste Zurich",
      // { lat: 47.372722, lng: 8.538739 }, // "Vanini Swiss chocolate 1871 Zurich",
      // { lat: 47.37175000000001, lng: 8.538757600000002 }, // "Prada Zurich",
      // { lat: 47.37374399999999, lng: 8.538444999999998 }, // "Zara Zurich",
      // { lat: 47.36931810000001, lng: 8.53973 }, // "Tommy hilfiger Zurich",
      // { lat: 47.3695145, lng: 8.5391644 }, // "Luxemburgerli מקרונים Zurich",
      // { lat: 47.000976, lng: 8.396296999999999 }, // "Hammetschwand Elevator המעלית החיצונית הגבוהה באירופה להזמין",
      // { lat: 47.0265402, lng: 8.3003062 }, // "Holiday Inn Express Luzern - Kriens, an IHG Hotel",
      // { lat: 46.83537949999999, lng: 9.0135015 }, // "אגם limmernsee",
      // { lat: 47.3180315, lng: 8.551619100000002 }, // "מוזאון השוקולד של לינדט Zurich",
    ];

    // , TravelMode.transit

    const routes = await Promise.all(
      [TravelMode.driving, TravelMode.walking].map(
        async (mode) => {
          // const rows = await this.googleMapsService.getRoutes(
          //   locations,
          //   locations,
          //   mode,
          //   "AIzaSyAZ41yXMXj5w8S0nX9hXuh5Rr_0z2chNyw",
          //   // "AIzaSyA7I3QU1khdOUoOwQm4xPhv2_jt_cwFSNU"
          // );
          const rows = await this.openStreetMapService.getRoutes(
              locations.map((x) => [x.lat, x.lng]),
              locations.map((x) => [x.lat, x.lng]),
              // @ts-ignore
              mode
          );
          return { mode, rows };
        }
      )
    );

    return {
      requestCount: this.googleMapsService.getRequestCount(),
      routes,
    };
  }
}
