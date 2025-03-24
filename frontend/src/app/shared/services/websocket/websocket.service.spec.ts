import { TestBed } from '@angular/core/testing';

import { WebsocketService } from './websocket.service';

describe('WebsocketService', () => {
  let service: WebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebsocketService]
    });
    service = TestBed.inject(WebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  xit('connect() should connect to the specified websocket and endpoint if not connected', () => {
    // TODO implement unit.test
  });

  xit('completeConnection() should close connection', () => {
    // TODO implement unit.test
  });

  xit('send() should send data over the websocket', () => {
    // TODO implement unit.test
  });

  xit('getChannel() should subscribe to a specific channel', () => {
    // TODO implement unit.test
  });
});
