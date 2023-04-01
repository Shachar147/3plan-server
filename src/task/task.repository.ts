import { EntityRepository, Repository } from "typeorm";
import {Task} from "./task.entity";
import {User} from "../user/user.entity";
import {InternalServerErrorException} from "@nestjs/common";
import {CreateTaskDto} from "./dto/create-task.dto";

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {

    async createTask(
        createTaskDto: CreateTaskDto,
        user: User,
    ): Promise<Task> {
        const {
            taskInfo,
            status,
            detailedStatus,
            progress,
            lastUpdateAt,
            relatedTrip,
            numOfGoogleCalls
        } = createTaskDto;
        const task = new Task();
        task.taskInfo = taskInfo;
        task.status = status;
        task.detailedStatus = detailedStatus;
        task.progress = progress;
        task.lastUpdateAt = lastUpdateAt;
        task.relatedTrip = relatedTrip;
        task.addedBy = user;
        task.numOfGoogleCalls = numOfGoogleCalls;

        try {
            await task.save();
        } catch (error) {
            throw new InternalServerErrorException();
        }

        return task;
    }

    async updateTask(
        updateTaskDto: Partial<CreateTaskDto>,
        taskStatus: Task,
        user: User,
    ): Promise<Task> {
        const {
            taskInfo,
            status,
            detailedStatus,
            progress,
            lastUpdateAt,
            relatedTrip,
            numOfGoogleCalls
        } = updateTaskDto;

        const updates: any = {};

        if (taskInfo) updates.taskInfo = taskInfo;
        if (status) updates.status = status;
        if (detailedStatus) updates.detailedStatus = detailedStatus;
        if (progress) updates.progress = progress;
        if (lastUpdateAt) updates.lastUpdateAt = lastUpdateAt;
        if (relatedTrip) updates.relatedTrip = relatedTrip;
        if (numOfGoogleCalls) updates.numOfGoogleCalls = numOfGoogleCalls;
        // if (user) updates.addedBy = user;
        updates.lastUpdateAt = new Date();

        const queryBuilder = this.createQueryBuilder('task');
        await queryBuilder
            .update(Task)
            .set(updates)
            .where('id = :id', { id: taskStatus.id })
            .execute();

        taskStatus = await this.findOne({ id: taskStatus.id});

        return taskStatus;
    }

}
