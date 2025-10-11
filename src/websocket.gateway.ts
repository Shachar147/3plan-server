import { Server } from 'ws';
import { Injectable } from '@nestjs/common';
import * as http from 'http';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user/user.entity';
import { Trip } from './trip/trip.entity';

const webSocketsLogPrefix = '[WEBSOCKETS]';

type WebSocketWithId = { socket: WebSocket; socketId: string };

@Injectable()
export class MyWebSocketGateway {
  private wsServer: Server;
  private clients: Record<number | string, Set<WebSocketWithId>> = {};

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
  ) {}

  async init(httpServer: http.Server) {
    // ✅ Use injected repositories
    const users = await this.userRepo.find();
    const trips = await this.tripRepo.find();

    const usersDict = users.reduce((acc, obj) => {
      acc[obj.id] = obj;
      return acc;
    }, {});
    const tripsDict = trips.reduce((acc, obj) => {
      acc[obj.id] = obj;
      return acc;
    }, {});

    console.log(`${webSocketsLogPrefix} Initializing Websockets gateway...`);
    this.wsServer = new Server({ server: httpServer });

    httpServer.on('connection', (socket, req) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userId = url.searchParams.get('uid');
      const socketId = url.searchParams.get('sid');
      const tripId = url.searchParams.get('tid');

      this.clients[userId] = this.clients[userId] || new Set<WebSocketWithId>();
      this.clients[userId].add({ socket, socketId });
      console.log(`${webSocketsLogPrefix} ${usersDict[userId]?.username} (Client #${userId}) connected`, `(${this.clients[userId].size} open sessions)`);

      if (tripId && tripId !== '0') {
        this.clients[`t${tripId}`] = this.clients[`t${tripId}`] || new Set<WebSocketWithId>();
        this.clients[`t${tripId}`].add({ socket, socketId });
        console.log(`${webSocketsLogPrefix} ${tripsDict[tripId]?.name} (Trip #${tripId}) connected`, `(${this.clients['t' + tripId].size} open sessions)`);
      }

      socket.on('message', (message) => {
        console.log(`${webSocketsLogPrefix} Received message: ${message}`);
        this.wsServer.emit('message', message);
      });

      socket.on('close', () => {
        const ws1 = Array.from(this.clients[userId] || []).find((a) => a.socket == socket);
        if (ws1) this.clients[userId].delete(ws1);

        if (tripId && tripId !== '0') {
          const ws2 = Array.from(this.clients[`t${tripId}`] || []).find((a) => a.socket == socket);
          if (ws2) this.clients[`t${tripId}`].delete(ws2);
        }
      });
    });

    console.log(`${webSocketsLogPrefix} WebSocket gateway initialized`);
  }

  send(message: string, userId: number | string, initiatedByClientId?: string): void {
    const set = this.clients[userId];
    if (!set) return;

    console.log(`${webSocketsLogPrefix} Sending Message to ${userId}, sessions: ${set.size}`);
    set.forEach((client) => {
      client.socket.send(JSON.stringify({ message, initiatedByClientId }));
    });
  }
}
