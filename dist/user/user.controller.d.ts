import { User } from './user.entity';
import { ListUserDto } from '../auth/dto/list-user-dto';
import { UserService } from './user.service';
import { DeleteResult } from "typeorm";
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    getUsers(listUserDto: ListUserDto): Promise<User[]>;
    deleteUser(id: any): Promise<DeleteResult>;
    deleteUsers(ids: any): Promise<DeleteResult>;
    deleteUserByName(name: any): Promise<DeleteResult>;
}
