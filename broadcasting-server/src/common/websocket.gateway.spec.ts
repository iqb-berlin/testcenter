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
    send: jest.fn()
  } as unknown as WebSocket;
  const client2 = {
    key: 'ClientKey2',
    token: 'tokenstring2',
    close: jest.fn(),
    send: jest.fn()
  } as unknown as WebSocket;
  const client3 = {
    key: 'ClientKey3',
    token: 'tokenstring2',
    close: jest.fn(),
    send: jest.fn()
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
  });

  it('should be defined', () => {
    expect(websocketGateway).toBeDefined();
  });

  it('it should handle a connection', () => {
    const spyLogger = jest.spyOn(websocketGateway['logger'], 'log');
    expect(websocketGateway.handleConnection(client, incomingMessage)).toBeUndefined(); // TODO ??
    expect(websocketGateway['clients']['clientToken']).toStrictEqual(client);
    expect(websocketGateway['clientsCount$'].next).toBeDefined(); // TODO warum auf next testen?
    expect(websocketGateway['clientsCount$'].value).toEqual(1);
    expect(spyLogger).toHaveBeenCalled();
  });

  it('should handle more than one connection', () => {
    const spyLogger = jest.spyOn(websocketGateway['logger'], 'log');
    expect(websocketGateway.handleConnection(client as WebSocket, incomingMessage)).toBeUndefined();
    expect(websocketGateway['clients']['clientToken']).toStrictEqual(client);
    expect(websocketGateway['clientsCount$'].next).toBeDefined();
    expect(websocketGateway['clientsCount$'].value).toEqual(1);
    expect(websocketGateway.handleConnection(client2, incomingMessage2)).toBeUndefined();
    expect(websocketGateway['clients']['clientToken2']).toStrictEqual(client2);
    expect(websocketGateway['clientsCount$'].value).toEqual(2);
    expect(spyLogger).toHaveBeenCalled();
  });

  it('should handle a disconnect (empty client list)', () => {
    websocketGateway.handleConnection(client, incomingMessage);
    expect(websocketGateway.handleDisconnect(client)).toBeUndefined();
    expect(websocketGateway['clients']['clientToken']).toBeUndefined();
    // TODO wenn der client nicht bekannt ist, sollte auch nix gefeuert werden(?)
    // expect(websocketGateway['clientLost$'].value).toStrictEqual('clientToken');
    expect(websocketGateway['clientsCount$'].value).toEqual(0);
  });

  it('should handle a disconnect (empty client list)', () => {
    const spyLogger = jest.spyOn(websocketGateway['logger'], 'log');
    const spyClientLost = jest.spyOn(websocketGateway['clientLost$'], 'next');
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleConnection(client2, incomingMessage2);
    expect(websocketGateway.handleDisconnect(client)).toBeUndefined();
    expect(websocketGateway['clients']['clientToken']).toBeUndefined();
    expect(websocketGateway['clients']['clientToken2']).toStrictEqual(client2);
    expect(websocketGateway['clientsCount$'].value).toEqual(1);
    expect(spyLogger).toHaveBeenCalled();
    expect(spyClientLost).toHaveBeenCalledWith('clientToken');
  });

  it('should disconnect a client (only one client)', () => {
    const monitorToken : string = 'clientToken';
    websocketGateway.handleConnection(client, incomingMessage);
    expect(websocketGateway.disconnectClient(monitorToken)).toBeUndefined();
    expect(websocketGateway['clients']['clientToken']).toBeUndefined();
    expect(websocketGateway['clients']).toStrictEqual({});
  });

  it('should disconnect a client (more than one client)', () => {
    const monitorToken : string = 'clientToken';
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleConnection(client2, incomingMessage2);
    expect(websocketGateway.disconnectClient(monitorToken)).toBeUndefined();
    expect(websocketGateway['clients']['clientToken']).toBeUndefined();
    expect(websocketGateway['clients']['clientToken2']).toStrictEqual(client2);
    expect(websocketGateway['clients']).toStrictEqual({
      clientToken2: {
        ...client2
      }
    });
  });

  it('should disconnect all Clients', () => {
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleConnection(client2, incomingMessage2);
    websocketGateway.disconnectAll();
    expect(websocketGateway['clients']).toStrictEqual({});
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
    const spySend = jest.spyOn(websocketGateway['clients']['clientToken'], 'send');
    const spySend2 = jest.spyOn(websocketGateway['clients']['clientToken2'], 'send');
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
