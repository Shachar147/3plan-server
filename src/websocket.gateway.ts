import { Server } from 'ws';
import { Injectable } from '@nestjs/common';
import * as http from "http";

@Injectable()
export class MyWebSocketGateway {
    private wsServer: Server;
    private clients: Record<number, Set<WebSocket>>;

    constructor() {
        this.clients = {};
        console.log("here");
    }

    init(httpServer: http.Server) {
        // console.log("there", httpServer);
        console.log("Initializing Websockets gateway...");
        this.wsServer = new Server({ server: httpServer });
        httpServer.on('connection', (socket, req) => {

            // Access the custom headers or query parameters from the WebSocket request
            const userId: string = new URL(req.url, `http://${req.headers.host}`).searchParams.get('uid');

            this.clients[userId] = this.clients[userId] || new Set<WebSocket>();
            this.clients[userId].add(socket);
            console.log(`Client #${userId} connected`, `(${this.clients[userId].size} open sessions)`);

            socket.on('message', (message) => {
                console.log('Received message:', message);
                // Handle WebSocket message

                // Broadcast the object to all connected clients
                this.wsServer.emit('message', message);
            });

            socket.on('close', () => {
                console.log('Client disconnected', userId);
                // Handle WebSocket disconnection
                this.clients[userId].delete(socket);
            });
        });

        console.log("WebSocket gateway initialized");
    }

    send(message: string, userId: number): void {

        console.log("")
        console.log(`There are ${Object.keys(this.clients).length} logged in clients.`)
        // console.log("Got Message:", message);
        console.log("Sending message only to user: ", userId);
        console.log(`user ${userId} have ${this.clients[userId]?.size ?? 0} opened sessions`);

        // Send a message to all connected clients
        this.clients[userId]?.forEach(client => {
            client.send(message);
        });
    }
}
