import { User } from './user.entity';
import { ListUserDto } from '../auth/dto/list-user-dto';
import { UserService } from './user.service';
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    getUsers(listUserDto: ListUserDto): Promise<User[]>;
}
