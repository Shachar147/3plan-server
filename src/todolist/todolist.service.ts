import {Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "../user/user.entity";
import {TodolistRepository} from "./todolist.repository";
import {getRepository} from "typeorm";
import {TodolistTask} from "./todolist.entity";
import {Trip} from "../trip/trip.entity";
import {TodolistTaskStatus} from "./dto/create-todolist-task-dto";
import {SharedTrips} from "../shared-trips/shared-trips.entity";
import {UpdateTodolistTaskDto} from "./dto/update-todolist-task-dto";

@Injectable()
export class TodolistService {

    private logger = new Logger("TodoListTaskService");
    constructor(
        @InjectRepository(TodolistRepository)
        private todolistRepository: TodolistRepository,
    ) {}

    async getTripIfHasPermissions(tripId: number, userId: number): Promise<Trip> {
        const tripRepository = getRepository(Trip); // Access the Trip repository directly
        const query = tripRepository.createQueryBuilder("trip")
            .where("trip.userId = :userId", { userId })
            .andWhere('trip.id = :id', { id: tripId });
        const trip = await query.getOne();

        if (!trip) {

            const sharedTripRepository = getRepository(SharedTrips); // Access the SharedTrip repository directly
            const shared_query = sharedTripRepository.createQueryBuilder("shared-trips")
                .where("shared-trips.userId = :userId", {userId})
                .andWhere('shared-trips.isDeleted = :isDeleted', {isDeleted: false});
            const sharedTrips = await shared_query.getMany();
            const tripIds = sharedTrips.map((x) => x.tripId);

            if (tripIds.includes(tripId)){
                const query = tripRepository.createQueryBuilder("trip")
                    .where('trip.id = :id', { id: tripId });
                return await query.getOne();
            }
        }

        if (!trip) {
            throw new NotFoundException(`Trip #${tripId} not found`);
        }
        return trip;
    }

    async createTask(tripId: number, title: string, status: TodolistTaskStatus, content: string = undefined, mustBeDoneBefore: number = undefined, eventId: number = undefined, addedByUser: User): Promise<TodolistTask> {
        const trip = await this.getTripIfHasPermissions(tripId, addedByUser.id)

        const where = {
            deletedAt: null,
            isDeleted: false,
            addedByUserId: addedByUser.id,
            tripId: tripId,
            title: title
        };

        // if there's event id, make sure there's such event on this trip.
        let foundEvent: any;
        // @ts-ignore
        const sidebarEvents: Record<string, any[]> = trip.sidebarEvents;
        if (eventId) {
            // @ts-ignore
            foundEvent = ([...trip.calendarEvents, ...Object.values(sidebarEvents).flat()] as any[]).find((event) => event.id == eventId);
            if (!foundEvent) {
                throw new NotFoundException(`Event #${eventId} not found on trip ${trip.name}`);
            }

            where["eventId"] = eventId;
        }

        // verify not already exists
        const found = await this.todolistRepository.findOne({
            where: where
        });
        if (found){
            if (eventId){
                throw new NotFoundException(`Task ${title} for trip "${trip.name}" event "${foundEvent.title}" already exists`);
            } else {
                throw new NotFoundException(`Task ${title} for trip "${trip.name}" already exists`);
            }
        }

        return await this.todolistRepository.createTask(trip, title, status, content, mustBeDoneBefore, eventId, addedByUser);
    }

//     async useInviteLink(token: string, user: User) {
//         const inviteLinkData = await this.todolistRepository.isTokenValid(token, user.id);
//         if (!inviteLinkData){
//             throw new BadRequestException(
//                 "invalidInviteLink",
//                 `invite link is invalid. probably expired.`
//             );
//         } else {
//
//             const currentTime = parseInt((new Date().getTime()/1000).toString());
//
//             // remove previous share links of this user for this trip
//             const prevPermissions =
//                 await this.todolistRepository.createQueryBuilder("todolist")
//                     .where("todolist.tripId = :id", { id: inviteLinkData.tripId })
//                     .andWhere('todolist.userId = :userId', { userId: user.id })
//                     .andWhere('todolist.isDeleted = :isDeleted', { isDeleted: false })
//                     .getMany();
//             for (let i=0; i< prevPermissions.length; i++){
//                 const prev = prevPermissions[i];
//                 prev.isDeleted = true;
//                 prev.deletedAt = currentTime;
//                 await prev.save();
//             }
//
//             if (inviteLinkData.invitedByUserId == user.id) {
//                 return inviteLinkData;
//             }
//             inviteLinkData.user = user;
//             inviteLinkData.acceptedAt = currentTime;
//             return await inviteLinkData.save();
//         }
//     }
//
//     async getTripCollaborators(tripName: string, user: User) {
//         const tripRepository = getRepository(Trip); // Access the Trip repository directly
//         const query = tripRepository.createQueryBuilder("trip")
//             .where("trip.userId = :userId", { userId: user.id })
//             .andWhere('trip.name = :name', { name: tripName });
//         const trip = await query.getOne();
//
//         if (!trip){
//             throw new NotFoundException(`Trip with name ${tripName} not found`);
//         }
//
//         const tripId = trip.id;
//
//         const collaborators = await this.todolistRepository.createQueryBuilder("todolist")
//             .where("todolist.tripId = :tripId", { tripId })
//             .andWhere("todolist.userId is not NULL")
//             .andWhere("todolist.isDeleted = :isDeleted", { isDeleted: false }).getMany();
//
//         const collaboratorsIds = collaborators.map((c) => c.userId);
//
//         if (collaboratorsIds.length == 0){
//             return [];
//         }
//
//         const users = await getRepository(User).createQueryBuilder("user")
//             .where('user.id IN (:...ids)', { ids: collaboratorsIds }) // Use the IN keyword with :...ids to pass the array of ids
//             .getMany();
//
//         users.forEach((u) => {
//             const permissions = collaborators.find((c) => c.userId == u.id);
//
//             // @ts-ignore
//             u.canRead = permissions.canRead;
//
//             // @ts-ignore
//             u.canWrite = permissions.canWrite;
//
//             // @ts-ignore
//             u.permissionsId = permissions.id;
//         });
//
//         return users;
//     }
//
//     async deletePermission(id: number, user: User, request: Request) {
//         const permission = await this.todolistRepository.findOne(id);
//         if (!permission) {
//             throw new NotFoundException(`Permission with id #${id} not found`);
//         }
//         if (permission.invitedByUserId != user.id){
//             throw new NotFoundException(`Only trip creator can delete collaborators`);
//         }
//
//         const currentTime = parseInt((new Date().getTime()/1000).toString());
//         permission.isDeleted = true;
//         permission.deletedAt = currentTime;
//         return await permission.save();
//     }
//
//     async updatePermission(id: number, updatePermissionDto: UpdateTodolistTaskDto, user: User, request: Request) {
//         const permission = await this.todolistRepository.findOne(id);
//         if (!permission) {
//             throw new NotFoundException(`Permission with id #${id} not found`);
//         }
//         if (permission.invitedByUserId != user.id){
//             throw new NotFoundException(`Only trip creator can modify permissions`);
//         }
//
//         permission.canWrite = updatePermissionDto.canWrite;
//         return await permission.save();
//     }
    async getTasksByTripId(tripId: number, user: User) {
        const trip = await this.getTripIfHasPermissions(tripId, user.id)

        const where = {
            deletedAt: null,
            isDeleted: false,
            tripId: tripId,
        };

        return await this.todolistRepository.find({
            where: where
        });
    }

    async getTaskById(id: number, user:User): Promise<TodolistTask> {
        const where = {
            deletedAt: null,
            isDeleted: false,
            id
        };

        const found = await this.todolistRepository.findOne({
            where: where
        });

        if (!found){
            throw new NotFoundException(`Todolist Task #${id} not found`);
        }

        // to validate current user has permissions on this task
        const trip = await this.getTripIfHasPermissions(found.tripId, user.id)

        return found;
    }

    async deleteTask(id, user: User, request: Request) {
        const found = await this.getTaskById(id, user);

        found.isDeleted = true;
        found.deletedAt = parseInt((new Date().getTime()/1000).toString());
        await found.save();

        return {
            "taskId": found.id,
            "tripId": found.tripId,
            "status": "deleted"
        }
    }

    async updateTask(id: number, params: UpdateTodolistTaskDto, user: User, request: Request) {
        const found = await this.getTaskById(id, user);
        const { title, content, eventId, mustBeDoneBefore, status } = params;

        let updates = 0;
        if (title && found.title !== title) {
            found.title = title;
            updates++;
        }

        if (content != undefined && found.content !== content) {
            found.content = content ? content : null;
            updates++;
        }

        if (eventId != undefined && found.eventId !== eventId) {
            found.eventId = eventId ? eventId : null;
            updates++;
        }

        if (mustBeDoneBefore != undefined && found.mustBeDoneBefore != mustBeDoneBefore) {
            found.mustBeDoneBefore = mustBeDoneBefore ? mustBeDoneBefore : null;
            updates++;
        }

        if (status && found.status != status) {
            found.status = status;
            updates++;
        }

        if (updates) {
            found.updatedAt = parseInt((new Date().getTime() / 1000).toString());
            await found.save();
        }
        return { task: found, updates };
    }
}
