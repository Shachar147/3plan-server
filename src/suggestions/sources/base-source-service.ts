import {NotImplementedException} from "@nestjs/common";
import {SearchResults} from "./utils/interfaces";
import {SearchDto} from "./dto/search-dto";

export abstract class BaseSourceService {
    async search(params: SearchDto): Promise<SearchResults> {
        throw new NotImplementedException()
    }
}
