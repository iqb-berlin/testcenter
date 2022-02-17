import { SysCheckModule } from './sys-check.module';

describe('SysCheckModule', () => {
  let sysCheckModule: SysCheckModule;

  beforeEach(() => {
    sysCheckModule = new SysCheckModule();
  });

  it('should create an instance', () => {
    expect(sysCheckModule).toBeTruthy();
  });
});
