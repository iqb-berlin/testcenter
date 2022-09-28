import {
  MessageBody, OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse
} from '@nestjs/websockets';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Logger } from '@nestjs/common';
import { BroadcastingEvent } from './interfaces';

@WebSocketGateway({ path: '/ws' })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  private server!: Server; // magically injected

  private clients: { [token: string] : WebSocket } = {};
  private clientsCount$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private clientLost$: Subject<string> = new Subject<string>();

  handleConnection(client: WebSocket, message: IncomingMessage): void {
    const token = WebsocketGateway.getTokenFromUrl(message.url as string);

    this.clients[token] = client;
    this.clientsCount$.next(Object.values(this.clients).length);
    this.logger.log(`client connected: ${token}`);
  }

  static getTokenFromUrl(url: string): string {
    const urlSearchParams = new URL(`xx://dumm.y/${url}`).searchParams;
    const token = urlSearchParams.get('token');
    if (!token) {
      throw new Error('No token!');
    }
    return token;
  }

  handleDisconnect(client: WebSocket): void {
    let disconnectedToken = '';
    Object.keys(this.clients).forEach((token: string) => {
      if (this.clients[token] === client) {
        delete this.clients[token];
        disconnectedToken = token;
      }
    });

    if (disconnectedToken !== '') {
      this.clientLost$.next(disconnectedToken);
      this.clientsCount$.next(Object.values(this.clients).length);
      this.logger.log(`client disconnected: ${disconnectedToken}`);
    }
  }

  broadcastToRegistered(tokens: string[], event: BroadcastingEvent, message: any): void {
    const payload = JSON.stringify({ event, data: message });

    tokens.forEach((token: string) => {
      if (typeof this.clients[token] !== 'undefined') {
        this.logger.log(`sending to client: ${token}`);
        this.clients[token].send(payload);
      }
    });
  }

  disconnectClient(monitorToken: string): void {
    if (typeof this.clients[monitorToken] !== 'undefined') {
      this.logger.log(`disconnect client: ${monitorToken}`);
      this.clients[monitorToken].close();
      delete this.clients[monitorToken];
    }
  }

  disconnectAll(): void {
    Object.keys(this.clients).forEach((token: string) => {
      this.disconnectClient(token);
    });
  }

  getDisconnectionObservable(): Observable<string> {
    return this.clientLost$.asObservable();
  }

  getClientTokens(): string[] {
    return Object.keys(this.clients);
  }

  @SubscribeMessage('subscribe:client.count')
  subscribeClientCount(@MessageBody() data: number): Observable<WsResponse<number>> {
    return this.clientsCount$.pipe(map((count: number) => ({ event: 'client.count', data: count })));
  }
}
