/* eslint-disable @typescript-eslint/dot-notation */
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { NavigationExtras, Router } from '@angular/router';
import { CustomtextService } from '../../shared/shared.module';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { TestLoaderService } from './test-loader.service';
import {
  TestLoadingProtocols, TestBooklet, TestBookletConfig, TestBookletXmlVariants, TestPlayers,
  TestUnitDefinitionsPerSequenceId, TestUnitPresentationProgressStates, TestUnitResponseProgressStates,
  TestUnitStateCurrentPages, TestUnitStateDataParts
} from '../unit-test-data/test-data';
import { LoadingProgress } from '../interfaces/test-controller.interfaces';
import { json } from '../unit-test-data/unit-test.util';
import { Watcher } from '../unit-test-data/watcher';
import { MockBackendService } from '../unit-test-data/mock-backend.service';

const MockCustomtextService = {
};

const MockRouter = {
  log: <string[]>[],
  navigate(commands: string[]): Promise<boolean> {
    this.log.push(...commands);
    return Promise.resolve(true);
  }
};

let service: TestLoaderService;

describe('TestLoaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestLoaderService,
        TestControllerService,
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
    it('should load and parse the booklet', async () => {
      await service.loadTest();
      expect(json(service.tcs.rootTestlet)).toEqual(json(TestBooklet));
      expect(service.tcs.bookletConfig).toEqual(TestBookletConfig);
    });

    it('should load the units, their definitions and their players', async () => {
      await service.loadTest();
      expect(service.tcs['unitDefinitions']).toEqual(TestUnitDefinitionsPerSequenceId);
      expect(service.tcs.bookletConfig).toEqual(TestBookletConfig);
      expect(service.tcs['players']).toEqual(TestPlayers);
    });

    it('should restore previous unit-states when loading test', async () => {
      await service.loadTest();
      expect(service.tcs['unitStateDataParts']).toEqual(TestUnitStateDataParts);
      expect(service.tcs['unitPresentationProgressStates']).toEqual(TestUnitPresentationProgressStates);
      expect(service.tcs['unitResponseProgressStates']).toEqual(TestUnitResponseProgressStates);
      expect(service.tcs['unitStateCurrentPages']).toEqual(TestUnitStateCurrentPages);
    });

    describe('should load booklet, units, unit-contents and players in the right order and track progress', () => {
      let watcher: Watcher;
      const loadTestWatched = async (testId: keyof typeof TestBookletXmlVariants) => {
        service.tcs.testId = testId;
        watcher = new Watcher();
        // watcher.log$.subscribe(console.log);
        watcher.watchObservable('tcs.testStatus$', service.tcs.testStatus$);
        watcher.watchMethod('tcs', service.tcs, 'setUnitLoadProgress$', { 1: null })
          .subscribe((args: [number, Observable<LoadingProgress>]) => {
            watcher.watchObservable(`tcs.unitContentLoadProgress$[${args[0]}]`, args[1]);
          });
        const everythingLoaded = watcher.watchProperty('tcs', service.tcs, 'totalLoadingProgress')
          .pipe(takeWhile(p => p < 100))
          .toPromise();
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

      it('even with broken booklet', async () => {
        try {
          await loadTestWatched('withBrokenBooklet');
          // eslint-disable-next-line no-empty
        } catch (e) {
        }
        expect(watcher.log).toEqual(TestLoadingProtocols.withBrokenBooklet);
      });

      it('even with missing player', async () => {
        try {
          await loadTestWatched('withMissingPlayer');
          // eslint-disable-next-line no-empty
        } catch (e) {
        }
        expect(watcher.log).toEqual(TestLoadingProtocols.withMissingPlayer);
      });

      it('even with missing unit-content', async () => {
        try {
          await loadTestWatched('withMissingUnitContent');
          // eslint-disable-next-line no-empty
        } catch (e) {
        }
        expect(watcher.log).toEqual(TestLoadingProtocols.withMissingUnitContent);
      });
    });
  });
});
