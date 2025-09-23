import { enableProdMode, StaticProvider } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic(<StaticProvider[]>[
  {
    provide: 'BROADCASTER_URL',
    useValue: environment.broadcasterUrl
  },
  {
    provide: 'FILE_SERVER_URL',
    useValue: environment.fileServerUrl
  },
  {
    provide: 'BACKEND_URL',
    useValue: environment.backendUrl
  },
  {
    provide: 'IS_PRODUCTION_MODE',
    useValue: environment.production
  }
]).bootstrapModule(AppModule)
  .catch(err => console.log(err));
