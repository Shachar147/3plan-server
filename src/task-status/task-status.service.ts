import {Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {TaskStatusRepository} from "./task-status.repository";
import {User} from "../user/user.entity";
import {CreateTaskDto} from "./dto/create-task.dto";
import {TripService} from "../trip/trip.service";

@Injectable()
export class TaskStatusService {
    private logger = new Logger("TaskStatusService");
    constructor(
        @InjectRepository(TaskStatusRepository)
        private taskStatusRepository: TaskStatusRepository,
        private tripService: TripService
    ) {
    }

    async createTask(createTaskDto: CreateTaskDto, user: User) {
        return await this.taskStatusRepository.createTask(createTaskDto, user);
    }

    async updateTask(id: number, updateTripDto: Partial<CreateTaskDto>, user: User) {
        const task = await this.getTaskStatusById(user, id);
        if (!task){
            throw new NotFoundException(`Task #${id} not found`);
        }
        return this.taskStatusRepository.updateTask(updateTripDto, task, user);
    }

    async getActiveTasks(user: User) {
        return await this.taskStatusRepository.find({ addedBy: user });
    }

    async getTaskStatusById(user: User, id: number) {
        return await this.taskStatusRepository.findOne({ id, addedBy: user });
    }

    async getTaskStatusByTripName(user: User, name: string) {
        const trip = await this.tripService.getTripByName(name, user);
        return await this.taskStatusRepository.find({
            where: { relatedTrip: trip, addedBy: user },
            order: { id: "DESC" },
            take: 1,
        });
    }
}
