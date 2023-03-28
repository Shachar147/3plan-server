import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {TaskRepository} from "./task.repository";
import {User} from "../user/user.entity";
import {CreateTaskDto} from "./dto/create-task.dto";
import {TripService} from "../trip/trip.service";

@Injectable()
export class TaskService {
    constructor(
        @InjectRepository(TaskRepository)
        private taskRepository: TaskRepository,
        private tripService: TripService
    ) {
    }

    async createTask(createTaskDto: CreateTaskDto, user: User) {
        return await this.taskRepository.createTask(createTaskDto, user);
    }

    async updateTask(id: number, updateTripDto: Partial<CreateTaskDto>, user: User) {
        const task = await this.getTaskById(user, id);
        if (!task){
            throw new NotFoundException(`Task #${id} not found`);
        }
        return this.taskRepository.updateTask(updateTripDto, task, user);
    }

    async getActiveTasks(user: User) {
        return await this.taskRepository.find({ addedBy: user });
    }

    async getTaskById(user: User, id: number) {
        return await this.taskRepository.findOne({ id, addedBy: user });
    }

    async getTaskByTripName(user: User, name: string) {
        const trip = await this.tripService.getTripByName(name, user);
        return await this.taskRepository.find({
            where: { relatedTrip: trip, addedBy: user },
            order: { id: "DESC" },
            take: 1,
        });
    }
}
