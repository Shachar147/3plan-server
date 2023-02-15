import {Body, Controller, Delete, Get, Post} from '@nestjs/common';
import {InstagramService} from "./instagram.service";
import {ApiTags} from "@nestjs/swagger";

@ApiTags("Instagram")
@Controller('instagram')
export class InstagramController {

    constructor(private instagramService: InstagramService) {}

    @Post()
    getInstagramData(@Body() instagramPayload: { url: string }) {
        const { url } = instagramPayload;
        return this.instagramService.getInstagramData(url);
    }

    @Get("/saved-posts")
    getSavedPostsData() {
        return this.instagramService.getSavedPostsData()
    }

    @Post("/saved-posts")
    createInstagramData(){
        return this.instagramService.createInstagramSavedPostsData();
    }

    @Delete()
    deleteInstagramData(){
        return this.instagramService.deleteInstagramData();
    }

    @Post("json")
    createInstagramDataFromJSON(@Body() json: any){
        return this.instagramService.createInstagramDataFromJSON(json);
    }
}
