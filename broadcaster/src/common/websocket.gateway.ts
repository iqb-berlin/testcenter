import {
  MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit,
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
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly logger = new Logger(WebsocketGateway.name);
  private static readonly MAX_CONNECTIONS = 10000;
  private static readonly HEARTBEAT_INTERVAL = 30000;

  @WebSocketServer()
  private server!: Server; // magically injected

  private clients = new Map<string, WebSocket & { isAlive?: boolean }>();
  private clientsCount$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private clientLost$: Subject<string> = new Subject<string>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  afterInit(server: Server) {
    this.startHeartbeat();
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws, token) => {
        if (ws.isAlive === false) {
          this.logger.warn(`Client ${token} inactive, terminating.`);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, WebsocketGateway.HEARTBEAT_INTERVAL);
  }

  handleConnection(client: WebSocket & { isAlive?: boolean }, message: IncomingMessage): void {
    if (this.clients.size >= WebsocketGateway.MAX_CONNECTIONS) {
      this.logger.error('Max connections reached. Rejecting client.');
      client.close(1013, 'Try again later');
      return;
    }

    try {
      const token = WebsocketGateway.getTokenFromUrl(message.url as string);

      client.isAlive = true;
      client.on('pong', () => {
        client.isAlive = true;
      });

      this.clients.set(token, client);
      this.clientsCount$.next(this.clients.size);
      this.logger.log(`client connected: ${token}`);
    } catch (e) {
      this.logger.error('Connection rejected due to invalid token', e);
      client.close(1008, 'Invalid token');
    }
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
    for (const [token, ws] of this.clients.entries()) {
      if (ws === client) {
        this.clients.delete(token);
        disconnectedToken = token;
        break;
      }
    }

    if (disconnectedToken !== '') {
      this.clientLost$.next(disconnectedToken);
      this.clientsCount$.next(this.clients.size);
      this.logger.log(`client disconnected: ${disconnectedToken}`);
    }
  }

  broadcastToRegistered(tokens: string[], event: BroadcastingEvent, message: any): void {
    const payload = JSON.stringify({ event, data: message });

    tokens.forEach((token: string) => {
      const client = this.clients.get(token);
      if (client && client.readyState === WebSocket.OPEN) {
        this.logger.log(`sending to client: ${token}`);
        client.send(payload);
      }
    });
  }

  disconnectClient(monitorToken: string): void {
    const client = this.clients.get(monitorToken);
    if (client) {
      this.logger.log(`disconnect client: ${monitorToken}`);
      client.close();
      this.clients.delete(monitorToken);
    }
  }

  disconnectAll(): void {
    for (const [token, client] of this.clients.entries()) {
      this.disconnectClient(token);
    }
  }

  getDisconnectionObservable(): Observable<string> {
    return this.clientLost$.asObservable();
  }

  getClientTokens(): string[] {
    return Array.from(this.clients.keys());
  }

  @SubscribeMessage('subscribe:client.count')
  subscribeClientCount(@MessageBody() data: number): Observable<WsResponse<number>> {
    return this.clientsCount$.pipe(map((count: number) => ({ event: 'client.count', data: count })));
  }
}
