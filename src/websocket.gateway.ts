import { Server } from 'ws';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyWebSocketGateway {
    private server: Server;
    private clients: Set<WebSocket>;

    constructor() {
        this.server = new Server({ port: 8080 });
        this.clients = new Set<WebSocket>();

        this.server.on('connection', (socket) => {
            this.clients.add(socket);
            console.log('Client connected');

            socket.on('message', (message) => {
                console.log('Received message:', message);
                // Handle WebSocket message

                // Broadcast the object to all connected clients
                this.server.emit('message', message);
            });

            socket.on('close', () => {
                console.log('Client disconnected');
                // Handle WebSocket disconnection
                this.clients.delete(socket);
            });
        });
    }

    send(message: string): void {
        // Send a message to all connected clients
        this.clients.forEach(client => {
            client.send(message);
        });
    }
}
