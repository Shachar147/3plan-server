import { EntityRepository, Repository } from "typeorm";
import {TaskStatus} from "./task-status.entity";
import {User} from "../user/user.entity";
import {ConflictException, InternalServerErrorException} from "@nestjs/common";
import {CreateTaskDto} from "./dto/create-task.dto";


@EntityRepository(TaskStatus)
export class TaskStatusRepository extends Repository<TaskStatus> {

    async createTask(
        createTaskDto: CreateTaskDto,
        user: User,
    ): Promise<TaskStatus> {
        const {
            taskInfo,
            status,
            detailedStatus,
            progress,
            lastUpdateAt,
            relatedTrip
        } = createTaskDto;
        const taskStatus = new TaskStatus();
        taskStatus.taskInfo = taskInfo;
        taskStatus.status = status;
        taskStatus.detailedStatus = detailedStatus;
        taskStatus.progress = progress;
        taskStatus.lastUpdateAt = lastUpdateAt;
        taskStatus.relatedTrip = relatedTrip;
        taskStatus.addedBy = user;

        try {
            await taskStatus.save();
        } catch (error) {
            if (Number(error.code) === 23505) {
                // duplicate task
                throw new ConflictException("Task already exists");
            } else {
                throw new InternalServerErrorException();
            }
        }

        return taskStatus;
    }

    async updateTask(
        updateTaskDto: Partial<CreateTaskDto>,
        taskStatus: TaskStatus,
        user: User,
    ): Promise<TaskStatus> {
        const {
            taskInfo,
            status,
            detailedStatus,
            progress,
            lastUpdateAt,
            relatedTrip,
        } = updateTaskDto;

        const updates: any = {};

        if (taskInfo) updates.taskInfo = taskInfo;
        if (status) updates.status = status;
        if (detailedStatus) updates.detailedStatus = detailedStatus;
        if (progress) updates.progress = progress;
        if (lastUpdateAt) updates.lastUpdateAt = lastUpdateAt;
        if (relatedTrip) updates.relatedTrip = relatedTrip;
        // if (user) updates.addedBy = user;
        updates.lastUpdateAt = new Date();

        const queryBuilder = this.createQueryBuilder('task_status');
        await queryBuilder
            .update(TaskStatus)
            .set(updates)
            .where('id = :id', { id: taskStatus.id })
            .execute();

        taskStatus = await this.findOne({ id: taskStatus.id});

        return taskStatus;
    }

}
