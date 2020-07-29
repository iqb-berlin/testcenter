import {
    MessageBody, OnGatewayConnection, OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from '@nestjs/websockets';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Server, Client} from "ws";
import {IncomingMessage} from 'http';


function getLastUrlPart(url: string) {
    const arr = url.split("/").filter(e => e);
    return arr[arr.length - 1];
}

@WebSocketGateway()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private server: Server;

    private clients: {[token: string] : Client} = {};
    private clientsCount$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private clientLost$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

    handleConnection(client: Client, message: IncomingMessage): void {
        const token = getLastUrlPart(message.url);

        this.clients[token] = client;
        this.clientsCount$.next(Object.values(this.clients).length);
        console.log("client connected: " + token);
    }

    handleDisconnect(client: Client): void {
        let disconnectedToken = "";
        Object.keys(this.clients).forEach((token: string) => {
           if (this.clients[token] === client) {
               delete this.clients[token];
               disconnectedToken = token;
           }
        });

        if (disconnectedToken !== "") {
            this.clientLost$.next(disconnectedToken);
            this.clientsCount$.next(Object.values(this.clients).length);
            console.log("client disconnected: " + disconnectedToken);
        }
    }

    public broadCastToRegistered(tokens: string[], event: string, message: any): void {
        const payload = JSON.stringify({event: event, data: message});

        tokens.forEach((token: string) => {
            if (typeof this.clients[token] !== "undefined") {
                console.log("sending to client: " + token);
                this.clients[token].send(payload);
            }
        });
    }

    public disconnectClient(monitorToken: string): void {

        if (typeof this.clients[monitorToken] !== "undefined") {
            console.log('disconnect client: ' + monitorToken);
            this.clients[monitorToken].close();
            delete this.clients[monitorToken];
        }
    }

    public disconnectAll(): void {

        Object.keys(this.clients).forEach((token: string) => {
            this.disconnectClient(token);
        });
    }

    public getDisconnectionObservable(): Observable<string> {
        return this.clientLost$.asObservable();
    }

    public getClientTokens(): string[] {
        return Object.keys(this.clients);
    }

    @SubscribeMessage('subscribe:client.count')
    subscribeClientCount(@MessageBody() data: number): Observable<WsResponse<number>> {
        return this.clientsCount$.pipe(map((count: number) => ({ event: 'client.count', data: count })));
    }
}
