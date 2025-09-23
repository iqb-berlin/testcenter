// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { StaticProvider } from '@angular/core';
import { environment } from './environments/environment';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(<StaticProvider[]>[
    {
      provide: 'SERVER_URL',
      useValue: environment.backendUrl
    },
    {
      provide: 'FILE_SERVER_URL',
      useValue: environment.fileServerUrl
    },
    {
      provide: 'IS_PRODUCTION_MODE',
      useValue: environment.production
    }
  ])
);
