import {
    Body,
    Controller, Delete, Get,
    Injectable,
    Param, ParseIntPipe,
    Post, Put, Req,
    UseGuards, UsePipes,
    ValidationPipe
} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiParam, ApiTags} from "@nestjs/swagger";
import {TodolistService} from "./todolist.service";
import {AuthGuard} from "@nestjs/passport";
import {GetUser} from "../auth/get-user.decorator";
import {User} from "../user/user.entity";
import {TripService} from "../trip/trip.service";
import {CreateTodolistTaskDto, TodolistTaskStatus} from "./dto/create-todolist-task-dto";
import {UpdateTodolistTaskDto} from "./dto/update-todolist-task-dto";

@Injectable()
@ApiBearerAuth("JWT")
@ApiTags("Todo List")
@Controller("todolist/task")
export class TodolistController {
    constructor(
        private tripsService: TripService,
        private todoListService: TodolistService,
    ) {}

    @ApiParam({
        name: 'tripId',
        description: 'the id of the trip',
        required: true,
        type: 'number',
    })
    @ApiParam({
        name: 'title',
        description: 'the title of the task',
        required: true,
        type: 'string',
    })
    @ApiParam({
        name: 'status',
        description: 'the status of the task - one of: [' + Object.keys(TodolistTaskStatus).join(" | ") + "]",
        required: true,
        type: 'string',
    })
    @ApiParam({
        name: 'content',
        description: 'additional info / description of the task',
        required: false,
        type: 'string',
    })
    @ApiParam({
        name: 'mustBeDoneBefore',
        description: 'a timestamp date when this task must be done',
        required: false,
        type: 'number',
    })
    @ApiParam({
        name: 'eventId',
        description: 'the id of the event, if you want to assign this task to a specific event.',
        required: false,
        type: 'number',
    })
    @ApiOperation({ summary: "Create todolist task", description: "Create a new todolist task for specific trip" })
    @Post()
    @UseGuards(AuthGuard())
    async createTask(
        @Body(ValidationPipe) params: CreateTodolistTaskDto,
        @GetUser() user: User
    ) {
        const { tripId, title, status, content, mustBeDoneBefore, eventId } = params;
        const createdTask = await this.todoListService.createTask(tripId, title, status, content, mustBeDoneBefore, eventId, user);
        delete createdTask.trip;
        delete createdTask.addedByUser;

        return {
            "status": "created",
            "data": createdTask
        }
    }

    @ApiParam({
        name: 'tripId',
        description: 'trip id',
        required: true,
        type: 'number',
    })
    @ApiOperation({ summary: "Get trip tasks", description: "Get all tasks on a given trip by id" })
    @Get('/:tripId')
    @UseGuards(AuthGuard())
    async getTasksByTripId(
        @Param("tripId") tripId: number,
        @GetUser() user: User
    ) {
        const data = await this.todoListService.getTasksByTripId(tripId, user)
        return {
            total: data.length,
            data
        }
    }

    @ApiParam({
        name: 'tripId',
        description: 'trip id',
        required: true,
        type: 'number',
    })
    @ApiParam({
        name: 'eventId',
        description: 'event id',
        required: true,
        type: 'number',
    })
    @ApiOperation({ summary: "Get trip tasks", description: "Get all tasks on a given trip by id" })
    @Get('/:tripId/:eventId')
    @UseGuards(AuthGuard())
    async getTasksByEventId(
        @Param("tripId") tripId: number,
        @Param("eventId") eventId: number,
        @GetUser() user: User
    ) {
        const data = await this.todoListService.getTasksByEventId(tripId, eventId, user)
        return {
            total: data.length,
            data
        }
    }

    @ApiOperation({ summary: "Delete todolist task", description: "Delete todolist task by id" })
    @ApiParam({
        name: "id",
        description: "todolist task id",
        required: true,
        type: "number",
    })
    @Delete("/:id")
    @UseGuards(AuthGuard())
    async deleteTask(
        @Param("id", ParseIntPipe) id,
        @GetUser() user: User,
        @Req() request: Request
    ) {
        const result = await this.todoListService.deleteTask(id, user, request);
        return result;
    }

    @ApiOperation({ summary: "Update todolist task", description: "Update todolist task by id" })
    @ApiParam({
        name: "id",
        description: "todolist task id",
        required: true,
        type: "number",
    })
    @Put("/:id")
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseGuards(AuthGuard())
    async updateTask(
        @Param("id", ParseIntPipe) id,
        @Body() params: UpdateTodolistTaskDto,
        @GetUser() user: User,
        @Req() request: Request
    ) {
        const result = await this.todoListService.updateTask(id, params, user, request);
        return {
            ...result,
            status: result.updates ? "updated" : "no-update"
        }
    }
}
