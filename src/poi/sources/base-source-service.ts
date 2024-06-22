import {NotImplementedException} from "@nestjs/common";
import {SearchResults} from "../utils/interfaces";
import {SearchDto} from "../dto/search-dto";
import {User} from "../../user/user.entity";

export abstract class BaseSourceService {
    async search(params: SearchDto, user: User): Promise<SearchResults> {
        throw new NotImplementedException()
    }
}
