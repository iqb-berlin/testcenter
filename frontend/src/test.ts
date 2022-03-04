// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { StaticProvider } from '@angular/core';
import { environment } from './environments/environment';

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
      provide: 'IS_PRODUCTION_MODE',
      useValue: environment.production
    }
  ])
);
// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
