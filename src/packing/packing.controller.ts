import {
    Body,
    Controller, Delete, Get,
    Injectable,
    Param, ParseIntPipe,
    Post, Put,
    UseGuards, UsePipes,
    ValidationPipe
} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiParam, ApiTags} from "@nestjs/swagger";
import {PackingService} from "./packing.service";
import {AuthGuard} from "@nestjs/passport";
import {GetUser} from "../auth/get-user.decorator";
import {User} from "../user/user.entity";
import {CreatePackingItemDto} from "./dto/create-packing-item.dto";
import {UpdatePackingItemDto} from "./dto/update-packing-item.dto";
import {CreatePackingCategoryDto} from "./dto/create-packing-category.dto";
import {UpdatePackingCategoryDto} from "./dto/update-packing-category.dto";

@Injectable()
@ApiBearerAuth("JWT")
@ApiTags("Packing")
@Controller("packing")
export class PackingController {
    constructor(
        private packingService: PackingService,
    ) {}

    // PackingItem endpoints
    @ApiParam({
        name: 'tripId',
        description: 'the id of the trip',
        required: true,
        type: 'number',
    })
    @ApiParam({
        name: 'title',
        description: 'the title of the packing item',
        required: true,
        type: 'string',
    })
    @ApiParam({
        name: 'categoryId',
        description: 'the id of the category (optional)',
        required: false,
        type: 'number',
    })
    @ApiParam({
        name: 'isPacked',
        description: 'whether the item is packed',
        required: false,
        type: 'boolean',
    })
    @ApiOperation({ summary: "Create packing item", description: "Create a new packing item for specific trip" })
    @Post("item")
    @UseGuards(AuthGuard())
    async createItem(
        @Body(ValidationPipe) params: CreatePackingItemDto,
        @GetUser() user: User
    ) {
        const { tripId, title, icon, categoryId, isPacked, order } = params;
        const createdItem = await this.packingService.createItem(tripId, title, icon ?? undefined, categoryId ?? undefined, isPacked || false, order || 0, user);
        delete createdItem.trip;
        delete createdItem.addedByUser;
        delete createdItem.category;

        return {
            "status": "created",
            "data": createdItem
        }
    }

    @ApiParam({
        name: 'tripId',
        description: 'trip id',
        required: true,
        type: 'number',
    })
    @ApiOperation({ summary: "Get trip packing items", description: "Get all packing items on a given trip by id" })
    @Get("item/:tripId")
    @UseGuards(AuthGuard())
    async getItemsByTripId(
        @Param("tripId") tripId: number,
        @GetUser() user: User
    ) {
        const data = await this.packingService.getItemsByTripId(tripId, user)
        return {
            total: data.length,
            data
        }
    }

    @ApiOperation({ summary: "Delete packing item", description: "Delete packing item by id" })
    @ApiParam({
        name: "id",
        description: "packing item id",
        required: true,
        type: "number",
    })
    @Delete("item/:id")
    @UseGuards(AuthGuard())
    async deleteItem(
        @Param("id", ParseIntPipe) id,
        @GetUser() user: User
    ) {
        const result = await this.packingService.deleteItem(id, user);
        return result;
    }

    @ApiOperation({ summary: "Update packing item", description: "Update packing item by id" })
    @ApiParam({
        name: "id",
        description: "packing item id",
        required: true,
        type: "number",
    })
    @Put("item/:id")
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseGuards(AuthGuard())
    async updateItem(
        @Param("id", ParseIntPipe) id,
        @Body() params: UpdatePackingItemDto,
        @GetUser() user: User
    ) {
        const result = await this.packingService.updateItem(id, params, user);
        return {
            ...result,
            status: result.updates ? "updated" : "no-update"
        }
    }

    // PackingCategory endpoints
    @ApiParam({
        name: 'tripId',
        description: 'the id of the trip',
        required: true,
        type: 'number',
    })
    @ApiParam({
        name: 'name',
        description: 'the name of the category',
        required: true,
        type: 'string',
    })
    @ApiOperation({ summary: "Create packing category", description: "Create a new packing category for specific trip" })
    @Post("category")
    @UseGuards(AuthGuard())
    async createCategory(
        @Body(ValidationPipe) params: CreatePackingCategoryDto,
        @GetUser() user: User
    ) {
        const { tripId, name, icon, order } = params;
        const createdCategory = await this.packingService.createCategory(tripId, name, icon ?? undefined, order || 0, user);
        delete createdCategory.trip;
        delete createdCategory.addedByUser;
        delete createdCategory.items;

        return {
            "status": "created",
            "data": createdCategory
        }
    }

    @ApiParam({
        name: 'tripId',
        description: 'trip id',
        required: true,
        type: 'number',
    })
    @ApiOperation({ summary: "Get trip packing categories", description: "Get all packing categories on a given trip by id" })
    @Get("category/:tripId")
    @UseGuards(AuthGuard())
    async getCategoriesByTripId(
        @Param("tripId") tripId: number,
        @GetUser() user: User
    ) {
        const data = await this.packingService.getCategoriesByTripId(tripId, user)
        return {
            total: data.length,
            data
        }
    }

    @ApiOperation({ summary: "Delete packing category", description: "Delete packing category by id (items will be moved to uncategorized)" })
    @ApiParam({
        name: "id",
        description: "packing category id",
        required: true,
        type: "number",
    })
    @Delete("category/:id")
    @UseGuards(AuthGuard())
    async deleteCategory(
        @Param("id", ParseIntPipe) id,
        @GetUser() user: User
    ) {
        const result = await this.packingService.deleteCategory(id, user);
        return result;
    }

    @ApiOperation({ summary: "Update packing category", description: "Update packing category by id" })
    @ApiParam({
        name: "id",
        description: "packing category id",
        required: true,
        type: "number",
    })
    @Put("category/:id")
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseGuards(AuthGuard())
    async updateCategory(
        @Param("id", ParseIntPipe) id,
        @Body() params: UpdatePackingCategoryDto,
        @GetUser() user: User
    ) {
        const result = await this.packingService.updateCategory(id, params, user);
        return {
            ...result,
            status: result.updates ? "updated" : "no-update"
        }
    }
}

