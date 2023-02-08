import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  HttpService
} from '@nestjs/common';
import { ListTripsDto } from './dto/list-trips-dto';
import { CreateTripDto } from './dto/create-trip-dto';
import { UpdateTripDto } from './dto/update-trip-dto';
import { TripRepository } from './trip.repository';
import { InjectRepository } from '@nestjs/typeorm';
import {User} from "../user/user.entity";

@Injectable()
export class TripService {
  private logger = new Logger('TripService');
  constructor(
    @InjectRepository(TripRepository)
    private tripRepository: TripRepository,
    private readonly httpService: HttpService
  ) {}

  async getTrips(filterDto: ListTripsDto, user: User) {
    return await this.tripRepository.getTrips(filterDto, user);
  }

  async getTrip(id: number, user: User) {
    const found = await this.tripRepository.findOne(id);
    if (!found || (found && found.user.id !== user.id)) {
      throw new NotFoundException(`Trip with id #${id} not found`);
    }
    return found;
  }

  async getTripByNameFull(name: string) {
    const found = await this.tripRepository.findOne({ name: name });
    if (!found) {
      throw new NotFoundException(`Trip with name ${name} not found`);
    }
    return found;
  }

  async getTripByName(name: string, user: User) {

    // debug - simulate long load
    // await new Promise(r => setTimeout(r, 10000)); // todo remove

    // const found = await this.tripRepository.createQueryBuilder('trip').where("LOWER(trip.name) = LOWER(:name)", { name }).leftJoinAndSelect('trip.players', 'player').getOne();
    const found = await this.tripRepository._getTripByName(name, user);
    if (!found) {
      throw new NotFoundException(`Trip with name ${name} not found`);
    }
    return found;
  }

  async createTrip(createTripDto: CreateTripDto, user: User) {
    // // validation
    // ['name', 'logo', 'division', 'conference'].forEach((iter) => {
    //   if (createTripDto[iter] == undefined) {
    //     throw new BadRequestException(`${iter} : missing`);
    //   }
    // });
    return await this.tripRepository.createTrip(createTripDto, user);
  }

  async upsertTrip(createTripDto: CreateTripDto, user: User) {
    const { name } = createTripDto;

    if (!name) {
      throw new BadRequestException('name : missing');
    }

    return await this.tripRepository.upsertTrip(createTripDto, user);
  }

  async updateTrip(id: number, updateTripDto: UpdateTripDto, user: User) {
    const trip = await this.getTrip(id, user);

    // if (
    //   !updateTripDto.name &&
    //   !updateTripDto.logo &&
    //   !updateTripDto.division &&
    //   !updateTripDto.conference
    // ) {
    //   throw new NotFoundException(`You have to pass fields to update`);
    // }

    return this.tripRepository.updateTrip(updateTripDto, trip, user);
  }

  async updateTripByName(name: string, updateTripDto: UpdateTripDto, user: User) {
    const trip = await this.getTripByName(name, user);

    // if (
    //   !updateTripDto.name &&
    //   !updateTripDto.logo &&
    //   !updateTripDto.division &&
    //   !updateTripDto.conference
    // ) {
    //   throw new NotFoundException(`You have to pass fields to update`);
    // }

    return this.tripRepository.updateTrip(updateTripDto, trip, user);
  }

  async deleteTrip(id: number, user: User) {
    const trip = this.getTrip(id, user);
    if (!trip){
      throw new NotFoundException(`Trip with id #${id} not found`);
    }
    const result = await this.tripRepository.delete({ id: id });
    if (result.affected === 0) {
      throw new NotFoundException(`Trip with id #${id} not found`);
    }
    return result;
  }

  async deleteTripByName(name: string, user: User) {
    const trip = this.getTripByName(name, user);
    if (!trip){
      throw new NotFoundException(`Trip with name ${name} not found`);
    }
    const result = await this.tripRepository.delete({ name: name });
    if (result.affected === 0) {
      throw new NotFoundException(`Trip with name "${name}" not found`);
    }
    return result;
  }

  async getInstagramData(url: string){
    const allPossibleCountries = [
      "Afghanistan",
      "Albania",
      "Algeria",
      "Andorra",
      "Angola",
      "Antigua and Barbuda",
      "Argentina",
      "Armenia",
      "Australia",
      "Austria",
      "Azerbaijan",
      "Bahamas",
      "Bahrain",
      "Bangladesh",
      "Barbados",
      "Belarus",
      "Belgium",
      "Belize",
      "Benin",
      "Bhutan",
      "Bolivia",
      "Bosnia and Herzegovina",
      "Botswana",
      "Brazil",
      "Brunei ",
      "Bulgaria",
      "Burkina Faso",
      "Burundi",
      "Côte d'Ivoire",
      "Cabo Verde",
      "Cambodia",
      "Cameroon",
      "Canada",
      "Central African Republic",
      "Chad",
      "Chile",
      "China",
      "Colombia",
      "Comoros",
      "Congo (Congo-Brazzaville)",
      "Costa Rica",
      "Croatia",
      "Cuba",
      "Cyprus",
      "Czechia (Czech Republic)",
      "Democratic Republic of the Congo",
      "Denmark",
      "Djibouti",
      "Dominica",
      "Dominican Republic",
      "Ecuador",
      "Egypt",
      "El Salvador",
      "Equatorial Guinea",
      "Eritrea",
      "Estonia",
      "Swaziland",
      "Ethiopia",
      "Fiji",
      "Finland",
      "France",
      "Gabon",
      "Gambia",
      "Georgia",
      "Germany",
      "Ghana",
      "Greece",
      "Grenada",
      "Guatemala",
      "Guinea",
      "Guinea-Bissau",
      "Guyana",
      "Haiti",
      "Holy See",
      "Honduras",
      "Hungary",
      "Iceland",
      "India",
      "Indonesia",
      "Iran",
      "Iraq",
      "Ireland",
      "Israel",
      "Italy",
      "Jamaica",
      "Japan",
      "Jordan",
      "Kazakhstan",
      "Kenya",
      "Kiribati",
      "Kuwait",
      "Kyrgyzstan",
      "Laos",
      "Latvia",
      "Lebanon",
      "Lesotho",
      "Liberia",
      "Libya",
      "Liechtenstein",
      "Lithuania",
      "Luxembourg",
      "Madagascar",
      "Malawi",
      "Malaysia",
      "Maldives",
      "Mali",
      "Malta",
      "Marshall Islands",
      "Mauritania",
      "Mauritius",
      "Mexico",
      "Micronesia",
      "Moldova",
      "Monaco",
      "Mongolia",
      "Montenegro",
      "Morocco",
      "Mozambique",
      "Myanmar (formerly Burma)",
      "Namibia",
      "Nauru",
      "Nepal",
      "Netherlands",
      "New Zealand",
      "Nicaragua",
      "Niger",
      "Nigeria",
      "North Korea",
      "North Macedonia",
      "Norway",
      "Oman",
      "Pakistan",
      "Palau",
      "Palestine State",
      "Panama",
      "Papua New Guinea",
      "Paraguay",
      "Peru",
      "Philippines",
      "Poland",
      "Portugal",
      "Qatar",
      "Romania",
      "Russia",
      "Rwanda",
      "Saint Kitts and Nevis",
      "Saint Lucia",
      "Saint Vincent and the Grenadines",
      "Samoa",
      "San Marino",
      "Sao Tome and Principe",
      "Saudi Arabia",
      "Senegal",
      "Serbia",
      "Seychelles",
      "Sierra Leone",
      "Singapore",
      "Slovakia",
      "Slovenia",
      "Solomon Islands",
      "Somalia",
      "South Africa",
      "South Korea",
      "South Sudan",
      "Spain",
      "Sri Lanka",
      "Sudan",
      "Suriname",
      "Sweden",
      "Switzerland",
      "Syria",
      "Tajikistan",
      "Tanzania",
      "Thailand",
      "Timor-Leste",
      "Togo",
      "Tonga",
      "Trinidad and Tobago",
      "Tunisia",
      "Turkey",
      "Turkmenistan",
      "Tuvalu",
      "Uganda",
      "Ukraine",
      "United Arab Emirates",
      "United Kingdom",
      "United States of America",
      "Uruguay",
      "Uzbekistan",
      "Vanuatu",
      "Venezuela",
      "Vietnam",
      "Yemen",
      "Zambia",
      "Zimbabwe"
    ];

    const mostPopularCities = [
      "Tokyo","Delhi","Shanghai","Dhaka","Sao Paulo","Mexico City","Cairo","Beijing","Mumbai","Osaka","Chongqing","Karachi","Istanbul","Kinshasa","Lagos","Buenos Aires","Kolkata","Manila","Tianjin","Guangzhou","Rio de Janeiro","Lahore","Bangalore","Shenzhen","Moscow","Chennai","Bogota","Paris","Jakarta","Lima","Bangkok","Hyderabad","Seoul","Nagoya","London","Chengdu","Nanjing","Tehran","Ho Chi Minh City","Luanda","New York City","Wuhan","Xi-an Shaanxi","Ahmedabad","Kuala Lumpur","Hangzhou","Surat","Suzhou","Hong Kong","Riyadh","Shenyang","Baghdad","Dongguan","Foshan","Dar es Salaam","Pune","Santiago","Madrid","Haerbin","Toronto","Belo Horizonte","Khartoum","Johannesburg","Singapore","Dalian","Qingdao","Zhengzhou","Ji-nan Shandong","Barcelona","Saint Petersburg","Abidjan","Yangon","Fukuoka","Alexandria","Guadalajara","Ankara","Chittagong","Addis Ababa","Melbourne","Nairobi","Hanoi","Sydney","Monterrey","Changsha","Brasilia","Cape Town","Jiddah","Urumqi","Kunming","Changchun","Hefei","Shantou","Xinbei","Kabul","Ningbo","Tel Aviv","Yaounde","Rome","Shijiazhuang","Montreal",
      "Recife","Kano","Porto Alegre","Fortaleza","Jaipur","Nanning","Medellin","Taiyuan Shanxi","Ekurhuleni","Douala","Kozhikode","Salvador","Los Angeles","Changzhou","Xiamen","Lucknow","Fuzhou Fujian","Casablanca","Wenzhou","Nanchang","Malappuram","Curitiba","Ibadan","Antananarivo","Tangshan Hebei","Abuja","Kampala","Kumasi","Faisalabad","Bekasi","Berlin","Guiyang","Busan","Santo Domingo","Asuncion","Campinas","Wuxi","Thrissur","Dakar","Port Harcourt","Mashhad","Kochi","Puebla","Kuwait City","Lanzhou","Indore","Durban","Kanpur","Sanaa","Athens","Milan","Pyongyang","Guayaquil","Izmir","Ouagadougou","Lusaka","Guatemala City","Kiev","Surabaya","Nagpur","Lisbon","Zhongshan","Dubai","Caracas","Depok","Shizuoka","Coimbatore","Handan","Port-au-Prince","Huaian","Algiers","Cali","Weifang","Incheon","Bamako","Goiania","Thiruvananthapuram","Manchester","Mbuji-Mayi","Chicago","Taipei","Pretoria","Zibo","Shaoxing","Lubumbashi","Yantai","Huizhou","Sapporo","Birmingham","Bandung","Vancouver","Accra","Toluca de Lerdo","Tashkent","Brazzaville","Luoyang","Patna","Bhopal","Damascus","Mogadishu",
      "Brisbane","Tangerang","San Juan","Tunis","Beirut","Nantong","Medan","Baku","Belem","Gujranwala","Houston","Peshawar","Manaus","Sendai","Maracaibo","Rawalpindi","Barranquilla","Agra","Hohhot","Taoyuan","Baotou","Kannur","Liuzhou","Visakhapatnam","Vadodara","Xuzhou","Tijuana","Esfahan","Phnom Penh","Amman","Daegu","Naples","Nashik","Vijayawada","Havana","Grande Vitoria","Mecca","Brussels","Multan","Aleppo","Putian","Perth","Yangzhou","Hiroshima","Baoding","Bursa","Taizhou Zhejiang","Minsk","Conakry","Wuhu Anhui","Linyi Shandong","Kollam","Rajkot","Haikou","Vienna","Valencia","Almaty","Daqing","Yancheng Jiangsu","Panama City","Semarang","Lianyungang","Rabat","Baixada Santista","Quito","Hyderabad","Lome","Ludhiana","West Yorkshire","Davao City","La Paz","Leon de los Aldamas","Zhuhai","Benin City","Datong","Quanzhou","Adana","Madurai","Turin","Matola","Warsaw","Hamburg","Can Tho","Sharjah","Bucharest","Palembang","Santa Cruz","Budapest","Gaziantep","Montevideo","Meerut","Raipur","Lyon","Jiangmen","Mosul","Cixi","La Laguna","Varanasi","Xiangyang","Shiraz",
      "Glasgow","Novosibirsk","Batam","Stockholm","Yinchuan","Anshan","Jamshedpur","Yichang","Srinagar","Auckland","Jilin","Ulaanbaatar","Tabriz","Makassar","Aurangabad","Phoenix","Qinhuangdao","Xining","Muscat","Monrovia","Marseille","Tiruppur","Philadelphia","Hengyang","Calgary","Qiqihaer","Cordoba","Suqian","Kananga","Karaj","Anyang","Rosario","Daejon","Munich","Ciudad Juarez","Harare","Onitsha","Jodhpur","Gaoxiong","Medina","Jining Shandong","Abu Dhabi","N-Djamena","Tegucigalpa","Gwangju","Yekaterinburg","Kathmandu","Edmonton","Natal","Grande Sao Luis","Ranchi","Zhangjiakou","Mandalay","Jabalpur","Huainan","Asansol","Kota","Chaozhou","San Antonio","Gwalior","San Jose","Allahabad","Yiwu","Chon Buri","Nouakchott","Amritsar","Kharkiv","Ottawa","Zurich","Taizhou Jiangsu","Basra","Joao Pessoa","Ganzhou","Belgrade","San Diego","Homs","Taian Shandong","Weihai","Queretaro","Mombasa","Niamey","Konya","Hai Phong","Jiaxing","Copenhagen","Cochabamba","Dhanbad","Kisangani","Bucaramanga","Kaifeng","Adelaide","Taizhong","Rizhao","Maceio","Suweon","Dongying","Zunyi","Zhanjiang","Samut Prakan","Nanchong",
      "Joinville","Qom","Helsinki","Mianyang Sichuan","Dallas","Liuan","Porto","Antalya","Shiyan","Prague","Bareilly","Liuyang","Ad-Dammam","Fushun Liaoning","Pointe-Noire","Yingkou","Sofia","Kazan","Tengzhou","Port Elizabeth","Aligarh","Ahvaz","Florianopolis","Tanger","Freetown","Maoming","Pekan Baru","Fes","Moradabad","Suzhou","Uyo","Mysore","Dublin","San Luis Potosi","Astana","Nizhniy Novgorod","Ruian","Mwanza","Durg-Bhilainagar","Barquisimeto","Jieyang","Chelyabinsk","Zhuzhou","Baoji","Maracay","Bhubaneswar","Pingdingshan Henan","Zhenjiang Jiangsu","Chifeng","Puning","Lilongwe","Jinhua","Mendoza","Kigali","Bogor","Huaibei","Merida","Tiruchirappalli","Islamabad","Chiang Mai","Nanyang Henan","Xiangtan Hunan","Benxi","Jinzhou","Chandigarh","Bukavu","Abomey-Calavi","Da Nang","Liupanshui","Omsk","Nnewi","Tripoli","Guilin","Amsterdam","Tasikmalaya","Haifa","Binzhou","Pizhou","Quetta","Mexicali","Krasnoyarsk","Hubli-Dharwad","Kaduna","Samara","Guwahati","Aba","Luohe","Salem","Aguascalientes","Ufa","Bujumbura","Maputo","Bandar Lampung","Rostov-on-Don","Cologne","Yueqing","Saharanpur","Shimkent","Yongin","Xinxiang"
    ]

    const findDestination = (description: string, location?: any) => {
      let result = "N/A";
      [...allPossibleCountries, ...mostPopularCities].forEach((country) => {
        if (description.toLowerCase().indexOf(country.toLowerCase()) !== -1){
          result = country;
          return result;
        } else if (JSON.stringify(location).toLowerCase().indexOf(country.toLowerCase()) !== -1){
          result = country;
          return result;
        }
      })
      return result;
    }

    if (url.endsWith("/")){
      url = url.substring(0,url.length-1);
    }
    const content = await this.httpService.get(`${url}/?__a=1&__d=dis`).toPromise();;
    if (content?.data){
      const data = content?.data?.graphql?.shortcode_media;

      // return data;

      const { shortcode, display_url, is_video, edge_media_to_caption, location, video_url, video_play_count, video_view_count, edge_sidecar_to_children } = data;
      const description = edge_media_to_caption?.["edges"]?.[0]?.["node"]?.text;

      // video
      let videos = undefined;
      if (is_video){
        const video = {
          video_url,
          video_play_count,
          video_view_count
        };
        videos = [video];
      }

      // image
      let images = [display_url];

      // combo
      if (edge_sidecar_to_children) {
        const comboItems = edge_sidecar_to_children.edges?.map((iter) => iter?.node).filter(Boolean);

        images = edge_sidecar_to_children ?
            comboItems.filter((item) => !item.is_video).map((item) => item.display_url)
            : [display_url];

        videos = comboItems.filter((item) => item.is_video).map((item) => {
          const { video_url, video_play_count, video_view_count } = item;
          return { video_url, video_play_count, video_view_count };
          })
      }

      return {
        shortcode,
        images,
        videos,
        display_image: display_url,
        is_video,
        description,
        location,
        destination: findDestination(description, location)
      }
    }
    return {};
  }
}
