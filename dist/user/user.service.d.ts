import { ListUserDto } from '../auth/dto/list-user-dto';
import { UserRepository } from './user.repository';
export declare class UserService {
    private userRepository;
    private logger;
    constructor(userRepository: UserRepository);
    getUsers(filterDto: ListUserDto): Promise<import("./user.entity").User[]>;
}
