import { enableProdMode, StaticProvider } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic(<StaticProvider[]>[
  {
    provide: 'BACKEND_URL',
    useValue: environment.testcenterUrl
  },
  {
    provide: 'IS_PRODUCTION_MODE',
    useValue: environment.production
  }
]).bootstrapModule(AppModule)
  .catch(err => console.log(err));
