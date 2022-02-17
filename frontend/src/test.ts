// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { StaticProvider } from '@angular/core';
import { environment } from './environments/environment';
import packageJSON from '../package.json';

declare const require: any;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(<StaticProvider[]>[
    {
      provide: 'SERVER_URL',
      useValue: environment.testcenterUrl
    },
    {
      provide: 'APP_PUBLISHER',
      useValue: environment.appPublisher
    },
    {
      provide: 'APP_NAME',
      useValue: packageJSON.name
    },
    {
      provide: 'APP_VERSION',
      useValue: packageJSON.version
    },
    {
      provide: 'API_VERSION_EXPECTED',
      useValue: environment.apiVersionExpected
    },
    {
      provide: 'VERONA_PLAYER_API_VERSION_MIN',
      useValue: packageJSON.iqb['verona-player-api-versions'].min
    },
    {
      provide: 'VERONA_PLAYER_API_VERSION_MAX',
      useValue: packageJSON.iqb['verona-player-api-versions'].max
    },
    {
      provide: 'REPOSITORY_URL',
      useValue: packageJSON.repository.url
    },
    {
      provide: 'IS_PRODUCTION_MODE',
      useValue: environment.production
    }
  ])
);
// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
