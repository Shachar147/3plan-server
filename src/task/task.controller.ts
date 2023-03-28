import {
    Controller,
    Get, Param, ParseIntPipe,
    UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { GetUser } from "../auth/get-user.decorator";
import { User } from "../user/user.entity";
import { TaskService } from "./task.service";

@ApiBearerAuth("JWT")
@ApiTags("Task")
@Controller("task")
export class TaskController {
  constructor(private taskService: TaskService) {}

  @ApiOperation({ summary: "Get Tasks", description: "Get all tasks" })
  @Get()
  @UseGuards(AuthGuard())
  async getActiveTasks(@GetUser() user: User) {
    const tasks = await this.taskService.getActiveTasks(user);
    return {
      total: tasks.length,
      data: tasks,
    };
  }

    @ApiOperation({ summary: "Get Task by id", description: "get specific task by id" })
    @Get("/:id")
    @UseGuards(AuthGuard())
    async getTask(@Param("id", ParseIntPipe) id, @GetUser() user: User) {
        return await this.taskService.getTaskById(user, id);
    }

    @ApiOperation({ summary: "Get Task by trip name", description: "get specific task by trip name" })
    @Get("/trip/:name")
    @UseGuards(AuthGuard())
    async getTaskByTripName(@Param("name") name: string, @GetUser() user: User) {
        return await this.taskService.getTaskByTripName(user, name);
    }
}
