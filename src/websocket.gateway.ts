import { Server } from 'ws';
import { Injectable } from '@nestjs/common';
import * as http from "http";

const webSocketsLogPrefix = "[WEBSOCKETS]"

@Injectable()
export class MyWebSocketGateway {
    private wsServer: Server;
    private clients: Record<number, Set<WebSocket>>;

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

            this.clients[userId] = this.clients[userId] || new Set<WebSocket>();
            this.clients[userId].add(socket);
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
                this.clients[userId].delete(socket);
            });
        });

        console.log(`${webSocketsLogPrefix} WebSocket gateway initialized`);
    }

    send(message: string, userId: number): void {
        console.log(`${webSocketsLogPrefix} Sending Message to user #${userId}, to ${this.clients[userId]?.size ?? 0} sessions.`)

        // Send a message to all connected clients
        this.clients[userId]?.forEach(client => {
            client.send(message);
        });
    }
}
