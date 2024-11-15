/* eslint-disable @typescript-eslint/dot-notation */
// eslint-disable-next-line max-classes-per-file
import { TestBed } from '@angular/core/testing';
import { lastValueFrom, of } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CustomtextService, MainDataService } from '../../shared/shared.module';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { TestLoaderService } from './test-loader.service';
import {
  TestLoadingProtocols,
  getTestBookletConfig,
  TestBookletXmlVariants,
  TestPlayers, getTestData
} from '../test/test-data';
import { flattenTestlet } from '../test/unit-test.util';
import { Watcher } from '../test/watcher.util';
import { MockBackendService } from '../test/mock-backend.service';
import { MessageService } from '../../shared/services/message.service';
import { MockMainDataService } from '../test/mock-mds.service';

const TestBookletConfig = getTestBookletConfig();
const TestBookletRoot = getTestData().Testlets.root;

const MockCustomtextService = {
  addCustomTexts: () => undefined
};

const MockRouter = {
  log: <string[]>[],
  navigate(commands: string[]): Promise<boolean> {
    this.log.push(...commands);
    return Promise.resolve(true);
  }
};

class MockMessageService {
  // eslint-disable-next-line class-methods-use-this
  showError(text: string): void {}
}

class MockMatDialog {
  // eslint-disable-next-line class-methods-use-this
  open() {
    return {
      afterClosed: () => of([])
    };
  }
}

let service: TestLoaderService;

describe('TestLoaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestLoaderService,
        TestControllerService,
        {
          provide: MatDialog,
          useValue: new MockMatDialog()
        },
        {
          provide: BackendService,
          useValue: new MockBackendService()
        },
        {
          provide: CustomtextService,
          useValue: MockCustomtextService
        },
        {
          provide: Router,
          useValue: MockRouter
        },
        {
          provide: MessageService,
          useValue: MockMessageService
        },
        {
          provide: MainDataService,
          useValue: new MockMainDataService()
        }
      ]
    });
    service = TestBed.inject(TestLoaderService);
    service.tcs = TestBed.inject(TestControllerService);
    service.tcs.testId = 'withLoadingModeEager';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('(loadTest)', () => {
    it('should load and parse the booklet, load the units, their definitions and players', async () => {
      await service.loadTest();
      expect(flattenTestlet(service.tcs.booklet?.units)).toEqual(flattenTestlet(TestBookletRoot));
      expect(service.tcs.booklet?.config).toEqual(TestBookletConfig);
      expect(service.tcs['players']).toEqual(TestPlayers);
    });

    describe('should load booklet, units, unit-contents and players in the right order and track progress', () => {
      let watcher: Watcher;
      const loadTestWatched = async (testId: keyof typeof TestBookletXmlVariants) => {
        service.tcs.testId = testId;
        watcher = new Watcher();
        watcher.watchObservable('tcs.testStatus$', service.tcs.state$);
        const everythingLoaded = lastValueFrom(
          watcher.watchProperty('tcs', service.tcs, 'totalLoadingProgress')
            .pipe(takeWhile(p => p < 100))
        );
        watcher.watchMethod('tcs', service.tcs, 'addPlayer', { 1: null });
        watcher.watchMethod('bs', service['bs'], 'addTestLog', { 0: null, 1: testLogEntries => testLogEntries[0].key });
        const testStart = watcher.watchPromise('tls.loadTest', service.loadTest());
        return Promise.all([testStart, everythingLoaded]);
      };

      it('when loading_mode is LAZY', async () => {
        await loadTestWatched('withLoadingModeLazy');
        expect(watcher.log).toEqual(TestLoadingProtocols.withLoadingModeLazy);
      });

      it('when loading_mode is EAGER', async () => {
        await loadTestWatched('withLoadingModeEager');
        expect(watcher.log).toEqual(TestLoadingProtocols.withLoadingModeEager);
      });

      it('even with missing unit', async () => {
        try {
          await loadTestWatched('withMissingUnit');
          // eslint-disable-next-line no-empty
        } catch (e) { }
        expect(watcher.log).toEqual(TestLoadingProtocols.withMissingUnit);
      });

      it('and abort on broken booklet', async () => {
        try {
          await loadTestWatched('withBrokenBooklet');
          // eslint-disable-next-line no-empty
        } catch (e) {
        }
        expect(watcher.log).toEqual(TestLoadingProtocols.withBrokenBooklet);
      });

      it('and abort on missing player', async () => {
        try {
          await loadTestWatched('withMissingPlayer');
          // eslint-disable-next-line no-empty
        } catch (e) {
        }
        expect(watcher.log).toEqual(TestLoadingProtocols.withMissingPlayer);
      });

      it('and abort on missing unit-content', done => {
        // we have to set up the global error handler here, because what is thrown from inside loadUnit
        // can not be caught otherwise
        window.onerror = message => {
          expect(message).toContain('resource is missing');
          expect(watcher.log).toEqual(TestLoadingProtocols.withMissingUnitContent);
          window.onerror = null;
          done();
        };
        loadTestWatched('withMissingUnitContent')
          .finally(() => { window.onerror = null; })
          .then(() => done.fail('error was not thrown'));
      });
    });
  });
});
