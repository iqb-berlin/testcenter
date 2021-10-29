/* eslint-disable @typescript-eslint/dot-notation */
import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'ws';
import { IncomingMessage } from 'http';
import { isObservable } from 'rxjs';
import { WebsocketGateway } from './websocket.gateway';

let websocketGateway : WebsocketGateway;

describe('websocketGateway handle connection and disconnection (single client)', () => {
  const client = {
    key: 'ClientKey',
    token: 'tokenstring',
    close: jest.fn(),
    send: jest.fn()
  } as Client;
  const client2 = {
    key: 'ClientKey2',
    token: 'tokenstring2',
    close: jest.fn(),
    send: jest.fn()
  } as Client;
  const client3 = {
    key: 'ClientKey3',
    token: 'tokenstring2',
    close: jest.fn(),
    send: jest.fn()
  } as Client;
  const incomingMessage = {
    url: 'www.test.de/testEnde'
  } as IncomingMessage;
  const incomingMessage2 = {
    url: 'www.test.de/testEnde2'
  } as IncomingMessage;
  const incomingMessage3 = {
    url: 'www.test.de/testEnde3'
  } as IncomingMessage;
  const expectedTokens = ['testEnde', 'testEnde2', 'testEnde3'];

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
    expect(websocketGateway.handleConnection(client, incomingMessage)).toBeUndefined();
    expect(websocketGateway['clients']['testEnde']).toStrictEqual(client);
    expect(websocketGateway['clientsCount$'].next).toBeDefined();
    expect(websocketGateway['clientsCount$'].value).toEqual(1);
    expect(spyLogger).toHaveBeenCalled();
  });

  it('should handle more than one connection', () => {
    const spyLogger = jest.spyOn(websocketGateway['logger'], 'log');
    expect(websocketGateway.handleConnection(client, incomingMessage)).toBeUndefined();
    expect(websocketGateway['clients']['testEnde']).toStrictEqual(client);
    expect(websocketGateway['clientsCount$'].next).toBeDefined();
    expect(websocketGateway['clientsCount$'].value).toEqual(1);
    expect(websocketGateway.handleConnection(client2, incomingMessage2)).toBeUndefined();
    expect(websocketGateway['clients']['testEnde2']).toStrictEqual(client2);
    expect(websocketGateway['clientsCount$'].value).toEqual(2);
    expect(spyLogger).toHaveBeenCalled();
  });

  it('should handle a disconnect (empty client list)', () => {
    websocketGateway.handleConnection(client, incomingMessage);
    expect(websocketGateway.handleDisconnect(client)).toBeUndefined();
    expect(websocketGateway['clients']['testEnde']).toBeUndefined();
    expect(websocketGateway['clientLost$'].value).toStrictEqual('testEnde');
    expect(websocketGateway['clientsCount$'].value).toEqual(0);
  });

  it('should handle a disconnect (empty client list)', () => {
    const spyLogger = jest.spyOn(websocketGateway['logger'], 'log');
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleConnection(client2, incomingMessage2);
    expect(websocketGateway.handleDisconnect(client)).toBeUndefined();
    expect(websocketGateway['clients']['testEnde']).toBeUndefined();
    expect(websocketGateway['clients']['testEnde2']).toStrictEqual(client2);
    expect(websocketGateway['clientLost$'].value).toStrictEqual('testEnde');
    expect(websocketGateway['clientsCount$'].value).toEqual(1);
    expect(spyLogger).toHaveBeenCalled();
  });

  it('should disconnect a client (only one client)', () => {
    const monitorToken : string = 'testEnde';
    websocketGateway.handleConnection(client, incomingMessage);
    expect(websocketGateway.disconnectClient(monitorToken)).toBeUndefined();
    expect(websocketGateway['clients']['testEnde']).toBeUndefined();
    expect(websocketGateway['clients']).toStrictEqual({});
  });

  it('should disconnect a client (more than one client)', () => {
    const monitorToken : string = 'testEnde';
    websocketGateway.handleConnection(client, incomingMessage);
    websocketGateway.handleConnection(client2, incomingMessage2);
    expect(websocketGateway.disconnectClient(monitorToken)).toBeUndefined();
    expect(websocketGateway['clients']['testEnde']).toBeUndefined();
    expect(websocketGateway['clients']['testEnde2']).toStrictEqual(client2);
    expect(websocketGateway['clients']).toStrictEqual({
      testEnde2: {
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
    const spySend = jest.spyOn(websocketGateway['clients']['testEnde'], 'send');
    const spySend2 = jest.spyOn(websocketGateway['clients']['testEnde2'], 'send');
    const event = 'event string';
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
