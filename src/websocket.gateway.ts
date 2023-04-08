import { Server } from 'ws';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyWebSocketGateway {
    private server: Server;
    private clients: Record<number, Set<WebSocket>>;

    constructor() {
        this.server = new Server({ port: 8080 });
        this.clients = {};

        this.server.on('connection', (socket, req) => {

            // Access the custom headers or query parameters from the WebSocket request
            const userId: string = new URL(req.url, `http://${req.headers.host}`).searchParams.get('uid');

            this.clients[userId] = this.clients[userId] || new Set<WebSocket>();
            this.clients[userId].add(socket);
            console.log('Client connected', userId);

            // socket.on('message', (message) => {
            //     console.log('Received message:', message);
            //     // Handle WebSocket message
            //
            //     // Broadcast the object to all connected clients
            //     this.server.emit('message', message);
            // });

            socket.on('close', () => {
                console.log('Client disconnected', userId);
                // Handle WebSocket disconnection
                this.clients[userId].delete(socket);
            });
        });
    }

    send(message: string, userId: number): void {

        console.log("")
        console.log(`There are ${Object.keys(this.clients).length} logged in clients.`)
        // console.log("Got Message:", message);
        console.log("Sending message only to user: ", userId);
        console.log(`user ${userId} have ${this.clients[userId].size} opened sessions`);

        // Send a message to all connected clients
        this.clients[userId].forEach(client => {
            client.send(message);
        });
    }
}
