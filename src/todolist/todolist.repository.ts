import {ConflictException, Injectable, InternalServerErrorException, Logger} from "@nestjs/common";
import {EntityRepository, Repository} from "typeorm";
import {TodolistTask} from "./todolist.entity";
import {TodolistTaskStatus} from "./dto/create-todolist-task-dto";
import {User} from "../user/user.entity";
import {Trip} from "../trip/trip.entity";


@Injectable()
@EntityRepository(TodolistTask)
export class TodolistRepository extends Repository<TodolistTask> {
    private logger = new Logger("TodolistTaskRepository");

    async createTask(trip: Trip, title: string, status: TodolistTaskStatus, content: string = undefined, mustBeDoneBefore: number = undefined, eventId: number = undefined, addedByUser: User): Promise<TodolistTask> {
        const task = new TodolistTask();
        task.trip = trip;
        task.tripId = trip.id;
        task.title = title;
        task.status = status;
        task.addedByUser = addedByUser;
        task.mustBeDoneBefore = mustBeDoneBefore;
        task.content = content;
        task.eventId = eventId;
        task.addedAt = parseInt((new Date().getTime()/1000).toString());

        try {
            await task.save();
        } catch (error) {
            console.error(error);
            if (Number(error.code) === 23505) {
                // duplicate task name
                throw new ConflictException("Task with that name already exists");
            } else {
                throw new InternalServerErrorException();
            }
        }

        return task;
    }

    // async getSharedWithMeTripIds(user: User): Promise<number[]> {
    //     const result = await this.createQueryBuilder("todolist")
    //         .select("todolist.tripId")
    //         .where("todolist.userId = :userId", { userId: user.id })
    //         .andWhere('todolist.isDeleted = :isDeleted', { isDeleted: false })
    //         .getMany();
    //
    //     return result.map((x) => x.tripId);
    // }
}
