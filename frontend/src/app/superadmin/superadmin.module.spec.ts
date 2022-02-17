import { SuperadminModule } from './superadmin.module';

describe('SuperadminModule', () => {
  let superadminModule: SuperadminModule;

  beforeEach(() => {
    superadminModule = new SuperadminModule();
  });

  it('should create an instance', () => {
    expect(superadminModule).toBeTruthy();
  });
});
