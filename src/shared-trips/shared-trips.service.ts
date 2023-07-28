import {BadRequestException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "../user/user.entity";
import {SharedTripsRepository} from "./shared-trips.repository";
import {getRepository} from "typeorm";
import {SharedTrips} from "./shared-trips.entity";
import {Trip} from "../trip/trip.entity";
import {Request} from "express";
import {UpdateTripDto} from "../trip/dto/update-trip-dto";
import {UpdatePermissionDto} from "./dto/update-permission-dto";

@Injectable()
export class SharedTripsService {

    private logger = new Logger("SharedTripsService");
    constructor(
        @InjectRepository(SharedTripsRepository)
        private sharedTripsRepository: SharedTripsRepository,
    ) {

    }

    async createInviteLink(tripId: number, canRead: boolean, canWrite: boolean, user: User) {

        const tripRepository = getRepository(Trip); // Access the Trip repository directly
        const query = tripRepository.createQueryBuilder("trip")
            .where("trip.userId = :userId", { userId: user.id })
            .andWhere('trip.id = :tripId', { tripId });
        const trip = await query.getOne();
        if (trip.userId != user.id){
            throw new NotFoundException(`Only trip creator can share it to other people`);
        }

        const existingLink = await this.sharedTripsRepository.getExistingUnacceptedInvitelink(tripId, canRead, canWrite, user);
        if (existingLink) {
            existingLink.expiredAt = parseInt((new Date().getTime()/1000).toString());
            return await existingLink.save();
        }

        return await this.sharedTripsRepository.createInviteLink(tripId, canRead, canWrite, user);
    }

    async useInviteLink(token: string, user: User) {
        const inviteLinkData = await this.sharedTripsRepository.isTokenValid(token, user.id);
        if (!inviteLinkData){
            throw new BadRequestException(
                "invalidInviteLink",
                `invite link is invalid. probably expired.`
            );
        } else {

            const currentTime = parseInt((new Date().getTime()/1000).toString());

            // remove previous share links of this user for this trip
            const prevPermissions =
                await this.sharedTripsRepository.createQueryBuilder("shared-trips")
                    .where("shared-trips.tripId = :id", { id: inviteLinkData.tripId })
                    .andWhere('shared-trips.userId = :userId', { userId: user.id })
                    .andWhere('shared-trips.isDeleted = :isDeleted', { isDeleted: false })
                    .getMany();
            for (let i=0; i< prevPermissions.length; i++){
                const prev = prevPermissions[i];
                prev.isDeleted = true;
                prev.deletedAt = currentTime;
                await prev.save();
            }

            if (inviteLinkData.invitedByUserId == user.id) {
                return inviteLinkData;
            }
            inviteLinkData.user = user;
            inviteLinkData.acceptedAt = currentTime;
            return await inviteLinkData.save();
        }
    }

    async getTripCollaborators(tripName: string, user: User) {
        const tripRepository = getRepository(Trip); // Access the Trip repository directly
        const query = tripRepository.createQueryBuilder("trip")
            .where("trip.userId = :userId", { userId: user.id })
            .andWhere('trip.name = :name', { name: tripName });
        const trip = await query.getOne();

        if (!trip){
            throw new NotFoundException(`Trip with name ${tripName} not found`);
        }

        const tripId = trip.id;

        const collaborators = await this.sharedTripsRepository.createQueryBuilder("shared-trips")
            .where("shared-trips.tripId = :tripId", { tripId })
            .andWhere("shared-trips.userId is not NULL")
            .andWhere("shared-trips.isDeleted = :isDeleted", { isDeleted: false }).getMany();

        const collaboratorsIds = collaborators.map((c) => c.userId);

        if (collaboratorsIds.length == 0){
            return [];
        }

        const users = await getRepository(User).createQueryBuilder("user")
            .where('user.id IN (:...ids)', { ids: collaboratorsIds }) // Use the IN keyword with :...ids to pass the array of ids
            .getMany();

        users.forEach((u) => {
            const permissions = collaborators.find((c) => c.userId == u.id);

            // @ts-ignore
            u.canRead = permissions.canRead;

            // @ts-ignore
            u.canWrite = permissions.canWrite;

            // @ts-ignore
            u.permissionsId = permissions.id;
        });

        return users;
    }

    async deletePermission(id: number, user: User, request: Request) {
        const permission = await this.sharedTripsRepository.findOne(id);
        if (!permission) {
            throw new NotFoundException(`Permission with id #${id} not found`);
        }
        if (permission.invitedByUserId != user.id){
            throw new NotFoundException(`Only trip creator can delete collaborators`);
        }

        const currentTime = parseInt((new Date().getTime()/1000).toString());
        permission.isDeleted = true;
        permission.deletedAt = currentTime;
        return await permission.save();
    }

    async updatePermission(id: number, updatePermissionDto: UpdatePermissionDto, user: User, request: Request) {
        const permission = await this.sharedTripsRepository.findOne(id);
        if (!permission) {
            throw new NotFoundException(`Permission with id #${id} not found`);
        }
        if (permission.invitedByUserId != user.id){
            throw new NotFoundException(`Only trip creator can modify permissions`);
        }

        permission.canWrite = updatePermissionDto.canWrite;
        return await permission.save();
    }
}
