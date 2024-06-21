import { Server } from 'ws';
import { Injectable } from '@nestjs/common';
import * as http from "http";
import {getRepository} from "typeorm";
import {User} from "./user/user.entity";
import {Trip} from "./trip/trip.entity";

const webSocketsLogPrefix = "[WEBSOCKETS]"

type WebSocketWithId = { socket: WebSocket, socketId: string};

@Injectable()
export class MyWebSocketGateway {
    private wsServer: Server;
    private clients: Record<number, Set<WebSocketWithId>>;

    constructor() {
        this.clients = {};
    }

    async init(httpServer: http.Server) {

        const users = await getRepository(User).createQueryBuilder("user").getMany();
        const trips = await getRepository(Trip).createQueryBuilder("trip").getMany();
        const usersDict = users.reduce((acc, obj) => {
            acc[obj.id] = obj;
            return acc;
        }, {});
        const tripsDict = trips.reduce((acc, obj) => {
            acc[obj.id] = obj;
            return acc;
        }, {});

        // console.log("there", httpServer);
        console.log(`${webSocketsLogPrefix} Initializing Websockets gateway...`);
        this.wsServer = new Server({ server: httpServer });
        httpServer.on('connection', (socket, req) => {

            // Access the custom headers or query parameters from the WebSocket request
            const userId: string = new URL(req.url, `http://${req.headers.host}`).searchParams.get('uid');
            const socketId: string = new URL(req.url, `http://${req.headers.host}`).searchParams.get('sid');

            const tripId: string = new URL(req.url, `http://${req.headers.host}`).searchParams.get('tid');

            this.clients[userId] = this.clients[userId] || new Set<WebSocketWithId>();
            this.clients[userId].add({ socket, socketId });
            console.log(`${webSocketsLogPrefix} ${usersDict[userId]?.["username"]} (Client #${userId}) connected`, `(${this.clients[userId].size} open sessions)`);

            if (tripId && tripId !== "0") {
                this.clients[`t${tripId}`] = this.clients[`t${tripId}`] || new Set<WebSocketWithId>();
                this.clients[`t${tripId}`].add({socket, socketId});
                console.log(`${webSocketsLogPrefix} ${tripsDict[tripId]?.["name"]} (Trip #${tripId}) connected`, `(${this.clients['t' + tripId].size} open sessions)`);
            }

            socket.on('message', (message) => {
                console.log(`${webSocketsLogPrefix} Received message: ${message}`);
                // Handle WebSocket message

                // Broadcast the object to all connected clients
                this.wsServer.emit('message', message);
            });

            socket.on('close', () => {
                // Handle WebSocket disconnection
                const webSocketWithId = (Array.from(this.clients[userId]) as WebSocketWithId[]).find((a) => a.socket == socket);
                if (webSocketWithId) {
                    this.clients[userId].delete(webSocketWithId);
                }
                console.log(`${webSocketsLogPrefix} ${usersDict[userId]?.["username"]} (Client #${userId}) disconnected`, this.clients[userId].size > 2 ? `(There are still ${this.clients[userId].size} sessions)` : this.clients[userId].size > 1 ? `(There is still 1 open session)` : "");

                if (tripId && tripId !== "0") {
                    const webSocketWithId2 = (Array.from(this.clients[`t${tripId}`]) as WebSocketWithId[]).find((a) => a.socket == socket);
                    if (webSocketWithId2) {
                        this.clients[`t${tripId}`].delete(webSocketWithId2);
                    }

                    console.log(`${webSocketsLogPrefix} ${tripsDict[tripId]?.["name"]} (Trip #${tripId}) disconnected`, this.clients[`t${tripId}`].size > 2 ? `(There are still ${this.clients['t' + tripId].size} sessions)` : this.clients['t' + tripId].size > 1 ? `(There is still 1 open session)` : "");
                }
            });
        });

        console.log(`${webSocketsLogPrefix} WebSocket gateway initialized`);
    }

    /***
     *
     * @param message - the message we want to send to the clients
     * @param userId - the relevant user id we want to update
     * @param initiatedByClientId - the id of the client that initiated this update. (to be able to display different messages to the initiator / other clients)
     *
     */
    send(message: string, userId: number|string, initiatedByClientId?: string): void {

        // todo: think of a way to send sockets when 2 different users are on the same trip

        if (userId.toString().startsWith("t")){
            console.log(`${webSocketsLogPrefix} Sending Message to Trip #${userId}, to ${this.clients[userId]?.size ?? 0} sessions.`)
        } else {
            console.log(`${webSocketsLogPrefix} Sending Message to user #${userId}, to ${this.clients[userId]?.size ?? 0} sessions.`)
        }

        // Send a message to all connected clients
        this.clients[userId]?.forEach(client => {
            client.socket.send(JSON.stringify({ message, initiatedByClientId }));
        });
    }
}
