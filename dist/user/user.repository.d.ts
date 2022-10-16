import { Repository } from 'typeorm';
import { User } from './user.entity';
import { AuthCredentialsDto } from '../auth/dto/auth-credentials.dto';
import { ListUserDto } from '../auth/dto/list-user-dto';
export declare class UserRepository extends Repository<User> {
    private logger;
    signUp(authCredentialsDto: AuthCredentialsDto): Promise<void>;
    getUserByName(username: any): Promise<User>;
    validateUserPassword(authCredentialsDto: AuthCredentialsDto): Promise<string>;
    private hashPassword;
    getUsers(filterDto: ListUserDto): Promise<User[]>;
}
