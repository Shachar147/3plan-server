import {
    Controller,
    Get, Param, ParseIntPipe,
    UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { GetUser } from "../auth/get-user.decorator";
import { User } from "../user/user.entity";
import { TaskStatusService } from "./task-status.service";

@ApiBearerAuth("JWT")
@ApiTags("TaskStatus")
@Controller("task-status")
export class TaskStatusController {
  constructor(private taskStatusService: TaskStatusService) {}

  @ApiOperation({ summary: "Get Tasks", description: "Get all tasks" })
  @Get()
  @UseGuards(AuthGuard())
  async getActiveTasks(
    @GetUser() user: User
  ) {
    const tasks = await this.taskStatusService.getActiveTasks(user);
    return {
      total: tasks.length,
      data: tasks,
    };
  }

    @ApiOperation({ summary: "Get Task by id", description: "get specific task status by id" })
    @Get("/:id")
    @UseGuards(AuthGuard())
    async getTaskStatus(
        @Param("id", ParseIntPipe) id,
        @GetUser() user: User
    ) {
        return await this.taskStatusService.getTaskStatusById(user, id);
    }

    @ApiOperation({ summary: "Get Task by tripe name", description: "get specific task status by trip name" })
    @Get("/trip/:name")
    @UseGuards(AuthGuard())
    async getTaskStatusByTripName(
        @Param("name") name: string,
        @GetUser() user: User
    ) {
    console.log({ user, name });
        return await this.taskStatusService.getTaskStatusByTripName(user, name);
    }
}
