/* eslint-disable @typescript-eslint/dot-notation */
import { Test, TestingModule } from '@nestjs/testing';
import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { isObservable } from 'rxjs';
import { WebsocketGateway } from './websocket.gateway';
import { BroadcastingEvent } from './interfaces';

let websocketGateway : WebsocketGateway;

describe('websocketGateway handle connection and disconnection (single client)', () => {
  const client = {
    key: 'ClientKey',
    token: 'tokenstring',
    close: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
    terminate: jest.fn(),
    readyState: 1
  } as unknown as WebSocket;
  const client2 = {
    key: 'ClientKey2',
    token: 'tokenstring2',
    close: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
    terminate: jest.fn(),
    readyState: 1
  } as unknown as WebSocket;
  const client3 = {
    key: 'ClientKey3',
    token: 'tokenstring2',
    close: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
    terminate: jest.fn(),
    readyState: 1
  } as unknown as WebSocket;
  const incomingMessage = {
    url: 'www.test.de/ws?token=clientToken'
  } as IncomingMessage;
  const incomingMessage2 = {
    url: 'www.test.de/ws?token=clientToken2'
  } as IncomingMessage;
  const incomingMessage3 = {
    url: 'www.test.de/ws?token=clientToken3'
  } as IncomingMessage;
  const expectedTokens = ['clientToken', 'clientToken2', 'clientToken3'];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketGateway]
    }).compile();

    websocketGateway = module.get<WebsocketGateway>(WebsocketGateway);
    expectedTokens.forEach(token => websocketGateway.allowToken(token));
  });

  it('should be defined', () => {
    expect(websocketGateway).toBeDefined();
  });

  it('it should handle a connection', () => {
    const spyLogger = jest.spyOn(websocketGateway['logger'], 'log');
    expect(websocketGateway.handleConnection(client, incomingMessage)).toBeUndefined(); // TODO ??
    expect(websocketGateway['clients'].get('clientToken')).toStrictEqual(client);
    expect(websocketGateway['clientsCount$'].next).toBeDefined(); // TODO warum auf next testen?
    expect(websocketGateway['clientsCount$'].value).toEqual(1);
    expect(spyLogger).toHaveBeenCalled();
  });

  it('should handle more than one connection', () => {
    const spyLogger = jest.spyOn(websocketGateway['logger'], 'log');
    expect(websocketGateway.handleConnection(client as WebSocket, incomingMessage)).toBeUndefined();
    expect(websocketGateway['clients'].get('clientToken')).toStrictEqual(client);
    expect(websocketGateway['clientsCount$'].next).toBeDefined();
    expect(websocketGateway['clientsCount$'].value).toEqual(1);
    expect(websocketGateway.handleConnection(client2, incomingMessage2)).toBeUndefined();
    expect(websocketGateway['clients'].get('clientToken2')).toStrictEqual(client2);
    expect(websocketGateway['clientsCount$'].value).toEqual(2);
    expect(spyLogger).toHaveBeenCalled();
  });

  it('should reject a connection with a token that was not registered', () => {
    const unknownClient = { close: jest.fn(), on: jest.fn() } as unknown as WebSocket;
    const unknownMessage = { url: 'www.test.de/ws?token=unknownToken' } as IncomingMessage;
    websocketGateway.handleConnection(unknownClient, unknownMessage);
    expect(unknownClient.close).toHaveBeenCalledWith(1008, 'Invalid token');
    expect(websocketGateway['clients'].size).toEqual(0);
  });

  it('should reject a second connection with the same token', () => {
    const duplicateClient = { close: jest.fn(), on: jest.fn() } as unknown as WebSocket;
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleConnection(duplicateClient, incomingMessage);
    expect(duplicateClient.close).toHaveBeenCalledWith(1008, 'Invalid token');
    expect(websocketGateway['clients'].get('clientToken')).toStrictEqual(client);
    expect(websocketGateway['clients'].size).toEqual(1);
  });

  it('should reject a token after its client was disconnected', () => {
    const returningClient = { close: jest.fn(), on: jest.fn() } as unknown as WebSocket;
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.disconnectClient('clientToken');
    websocketGateway.handleConnection(returningClient, incomingMessage);
    expect(returningClient.close).toHaveBeenCalledWith(1008, 'Invalid token');
    expect(websocketGateway['clients'].size).toEqual(0);
  });

  it('should handle a disconnect (empty client list)', () => {
    websocketGateway.handleConnection(client, incomingMessage);
    expect(websocketGateway.handleDisconnect(client)).toBeUndefined();
    expect(websocketGateway['clients'].get('clientToken')).toBeUndefined();
    // TODO wenn der client nicht bekannt ist, sollte auch nix gefeuert werden(?)
    // expect(websocketGateway['clientLost$'].value).toStrictEqual('clientToken');
    expect(websocketGateway['clientsCount$'].value).toEqual(0);
  });

  it('should handle a disconnect (non-empty client list)', () => {
    const spyLogger = jest.spyOn(websocketGateway['logger'], 'log');
    const spyClientLost = jest.spyOn(websocketGateway['clientLost$'], 'next');
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleConnection(client2, incomingMessage2);
    expect(websocketGateway.handleDisconnect(client)).toBeUndefined();
    expect(websocketGateway['clients'].get('clientToken')).toBeUndefined();
    expect(websocketGateway['clients'].get('clientToken2')).toStrictEqual(client2);
    expect(websocketGateway['clientsCount$'].value).toEqual(1);
    expect(spyLogger).toHaveBeenCalled();
    expect(spyClientLost).toHaveBeenCalledWith('clientToken');
  });

  it('should disconnect a client (only one client)', () => {
    const monitorToken : string = 'clientToken';
    websocketGateway.handleConnection(client, incomingMessage);
    expect(websocketGateway.disconnectClient(monitorToken)).toBeUndefined();
    expect(websocketGateway['clients'].get('clientToken')).toBeUndefined();
    expect(websocketGateway['clients'].size).toEqual(0);
  });

  it('should disconnect a client (more than one client)', () => {
    const monitorToken : string = 'clientToken';
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleConnection(client2, incomingMessage2);
    expect(websocketGateway.disconnectClient(monitorToken)).toBeUndefined();
    expect(websocketGateway['clients'].get('clientToken')).toBeUndefined();
    expect(websocketGateway['clients'].get('clientToken2')).toStrictEqual(client2);
    expect(websocketGateway['clients'].size).toEqual(1);
  });

  it('should disconnect all Clients', () => {
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleConnection(client2, incomingMessage2);
    websocketGateway.disconnectAll();
    expect(websocketGateway['clients'].size).toEqual(0);
  });

  it('should return disconnections as observable', () => {
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleDisconnect(client);
    expect(isObservable(websocketGateway.getDisconnectionObservable())).toEqual(true);
  });

  it('should return all clientTokens', () => {
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleConnection(client2, incomingMessage2);
    websocketGateway.handleConnection(client3, incomingMessage3);
    expect(websocketGateway.getClientTokens()).toStrictEqual(expectedTokens);
  });

  it('should broadcast to all registered', () => {
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleConnection(client2, incomingMessage2);
    const spyLogger = jest.spyOn(websocketGateway['logger'], 'log');
    const spySend = jest.spyOn(client, 'send');
    const spySend2 = jest.spyOn(client2, 'send');
    const event = 'test-sessions' as BroadcastingEvent;
    const message = {};
    const tokens = websocketGateway.getClientTokens();
    websocketGateway.broadcastToRegistered(tokens, event, message);
    expect(spyLogger).toHaveBeenCalledTimes(2);
    expect(spySend).toHaveBeenCalled();
    expect(spySend2).toHaveBeenCalled();
  });

  it('should return subscribe:client.count', () => {
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleConnection(client2, incomingMessage2);
    expect(isObservable(websocketGateway.subscribeClientCount(1))).toStrictEqual(true);
  });
});

describe('websocketGateway heartbeat', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketGateway]
    }).compile();

    websocketGateway = module.get<WebsocketGateway>(WebsocketGateway);
    websocketGateway.allowToken('deadToken');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should report a client as lost when it stops answering pings', () => {
    const deadClient = {
      close: jest.fn(), on: jest.fn(), ping: jest.fn(), terminate: jest.fn()
    } as unknown as WebSocket & { isAlive?: boolean };
    const spyClientLost = jest.spyOn(websocketGateway['clientLost$'], 'next');
    websocketGateway.afterInit(websocketGateway['server']);
    websocketGateway.handleConnection(deadClient, { url: 'www.test.de/ws?token=deadToken' } as IncomingMessage);

    jest.advanceTimersByTime(30000); // first ping, no pong follows
    jest.advanceTimersByTime(30000);
    expect(deadClient.terminate).toHaveBeenCalled();

    websocketGateway.handleDisconnect(deadClient); // what Nest does on the close event of the terminated socket
    expect(spyClientLost).toHaveBeenCalledWith('deadToken');
    expect(websocketGateway['clients'].size).toEqual(0);
  });
});

describe('websocketGateway token expiry', () => {
  const connectingClient = {
    close: jest.fn(), on: jest.fn(), ping: jest.fn(), terminate: jest.fn()
  } as unknown as WebSocket;

  beforeEach(async () => {
    jest.useFakeTimers();
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketGateway]
    }).compile();

    websocketGateway = module.get<WebsocketGateway>(WebsocketGateway);
    websocketGateway.afterInit(websocketGateway['server']);
    websocketGateway.allowToken('unusedToken');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should expire a token that does not connect in time', () => {
    const spyTokenExpired = jest.spyOn(websocketGateway['tokenExpired$'], 'next');
    jest.advanceTimersByTime(30000);
    expect(spyTokenExpired).toHaveBeenCalledWith('unusedToken');
    expect(websocketGateway['allowedTokens'].has('unusedToken')).toEqual(false);
  });

  it('should reject a connection with an expired token', () => {
    jest.advanceTimersByTime(30000);
    websocketGateway.handleConnection(connectingClient, { url: 'www.test.de/ws?token=unusedToken' } as IncomingMessage);
    expect(connectingClient.close).toHaveBeenCalledWith(1008, 'Invalid token');
    expect(websocketGateway['clients'].size).toEqual(0);
  });

  it('should not expire a token that connected', () => {
    const spyTokenExpired = jest.spyOn(websocketGateway['tokenExpired$'], 'next');
    websocketGateway.handleConnection(connectingClient, { url: 'www.test.de/ws?token=unusedToken' } as IncomingMessage);
    jest.advanceTimersByTime(30000);
    expect(spyTokenExpired).not.toHaveBeenCalled();
    expect(websocketGateway['allowedTokens'].has('unusedToken')).toEqual(true);
  });

  it('should not expire a token registered shortly before the heartbeat', () => {
    const spyTokenExpired = jest.spyOn(websocketGateway['tokenExpired$'], 'next');
    jest.advanceTimersByTime(20000);
    websocketGateway.allowToken('lateToken');
    jest.advanceTimersByTime(10000);
    expect(spyTokenExpired).toHaveBeenCalledWith('unusedToken');
    expect(spyTokenExpired).not.toHaveBeenCalledWith('lateToken');
    jest.advanceTimersByTime(30000);
    expect(spyTokenExpired).toHaveBeenCalledWith('lateToken');
  });
});
