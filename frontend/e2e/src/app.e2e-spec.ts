import { browser, logging } from 'protractor';

import LoginPage from './app.po';

describe('Testcenter Frontend', () => {
  it('should display title texts', async () => {
    await LoginPage.navigateTo();
    await expect(LoginPage.getFirstCardTitle()).toEqual('Anmelden');
    await expect(LoginPage.getSecondCardTitle()).toEqual('IQB-Testcenter');
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE
    } as logging.Entry));
  });
});
