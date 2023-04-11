import { Server } from 'ws';
import { Injectable } from '@nestjs/common';
import * as http from "http";

const webSocketsLogPrefix = "[WEBSOCKETS]"

type WebSocketWithId = { socket: WebSocket, socketId: string};

@Injectable()
export class MyWebSocketGateway {
    private wsServer: Server;
    private clients: Record<number, Set<WebSocketWithId>>;

    constructor() {
        this.clients = {};
    }

    init(httpServer: http.Server) {
        // console.log("there", httpServer);
        console.log(`${webSocketsLogPrefix} Initializing Websockets gateway...`);
        this.wsServer = new Server({ server: httpServer });
        httpServer.on('connection', (socket, req) => {

            // Access the custom headers or query parameters from the WebSocket request
            const userId: string = new URL(req.url, `http://${req.headers.host}`).searchParams.get('uid');
            const socketId: string = new URL(req.url, `http://${req.headers.host}`).searchParams.get('sid');

            this.clients[userId] = this.clients[userId] || new Set<WebSocketWithId>();
            this.clients[userId].add({ socket, socketId });
            console.log(`${webSocketsLogPrefix} Client #${userId} connected`, `(${this.clients[userId].size} open sessions)`);

            socket.on('message', (message) => {
                console.log(`${webSocketsLogPrefix} Received message: ${message}`);
                // Handle WebSocket message

                // Broadcast the object to all connected clients
                this.wsServer.emit('message', message);
            });

            socket.on('close', () => {
                console.log(`${webSocketsLogPrefix} Client #${userId} disconnected`, this.clients[userId].size > 2 ? `(There are still ${this.clients[userId].size} sessions)` : this.clients[userId].size > 1 ? `(There is still 1 open session)` : "");

                // Handle WebSocket disconnection
                const webSocketWithId = (Array.from(this.clients[userId]) as WebSocketWithId[]).find((a) => a.socket == socket);
                if (webSocketWithId) {
                    this.clients[userId].delete(webSocketWithId);
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
    send(message: string, userId: number, initiatedByClientId?: string): void {

        console.log(`${webSocketsLogPrefix} Sending Message to user #${userId}, to ${this.clients[userId]?.size ?? 0} sessions.`)

        // Send a message to all connected clients
        this.clients[userId]?.forEach(client => {
            client.socket.send(JSON.stringify({ message, initiatedByClientId }));
        });
    }
}
