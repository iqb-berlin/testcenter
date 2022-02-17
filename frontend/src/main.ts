import { enableProdMode, StaticProvider } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import packageJson from '../package.json';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic(<StaticProvider[]>[
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
    useValue: packageJson.name
  },
  {
    provide: 'APP_VERSION',
    useValue: packageJson.version
  },
  {
    provide: 'API_VERSION_EXPECTED',
    useValue: environment.apiVersionExpected
  },
  {
    provide: 'VERONA_PLAYER_API_VERSION_MIN',
    useValue: packageJson.iqb['verona-player-api-versions'].min
  },
  {
    provide: 'VERONA_PLAYER_API_VERSION_MAX',
    useValue: packageJson.iqb['verona-player-api-versions'].max
  },
  {
    provide: 'REPOSITORY_URL',
    useValue: packageJson.repository.url
  },
  {
    provide: 'IS_PRODUCTION_MODE',
    useValue: environment.production
  }
]).bootstrapModule(AppModule)
  .catch(err => console.log(err));
