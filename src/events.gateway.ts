import {
    MessageBody, OnGatewayConnection, OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from '@nestjs/websockets';
import {BehaviorSubject, Observable} from 'rxjs';
import { map } from 'rxjs/operators';
import {Server, Client} from "ws";
import {IncomingMessage} from 'http';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    private server: Server;

    private clients: {client: Client, token: string}[] = [];
    private clientsCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);


    handleConnection(client: Client, message: IncomingMessage): void {

        this.clients.push({client, token: message.url});
        this.clientsCount.next(this.clientsCount.value + 1);
        console.log("connect", message.url);
    }


    handleDisconnect(client: Client): void {

        for (let i = 0; i < this.clients.length; i++) {
            if (this.clients[i].client === client) {
                this.clients.splice(i, 1);
                break;
            }
        }

        this.clientsCount.next(this.clientsCount.value - 1);

        console.log("disconnect");
    }


    public broadcast(event, message: any): void {

        for (let client of this.clients) {
            client.client.send(JSON.stringify({event: event, data: message}));
        }
    }


    @SubscribeMessage('subscribe:client.count')
    subscribeClientCount(@MessageBody() data: number): Observable<WsResponse<number>> {

        return this.clientsCount.pipe(map((count: number) => ({ event: 'client.count', data: count })));
    }
}
