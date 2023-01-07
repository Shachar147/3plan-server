import { ListUserDto } from '../auth/dto/list-user-dto';
import { UserRepository } from './user.repository';
export declare class UserService {
    private userRepository;
    private logger;
    constructor(userRepository: UserRepository);
    getUsers(filterDto: ListUserDto): Promise<import("./user.entity").User[]>;
    deleteUser(id: number): Promise<import("typeorm").DeleteResult>;
    deleteUserByName(name: string): Promise<import("typeorm").DeleteResult>;
    deleteUsersByIds(ids: number[]): Promise<{
        affected: number;
        errors: any[];
        raw: any;
    }>;
}
