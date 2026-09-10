import {
  deleteDownloadsFolder,
  loginMonitor,
  probeBackendApi,
  resetBackendTestData,
  visitLoginPage,
  clickCardButton
} from './utils';

describe('Study-Monitor User', () => {
  before(() => {
    deleteDownloadsFolder();
    resetBackendTestData();
    probeBackendApi();
  });
  beforeEach(() => {
    visitLoginPage();
  });

  it('start a study monitor', () => {
    loginMonitor('test-study-monitor', 'user123');

    clickCardButton('gm-card-0');
    cy.contains('Test-Steuerung');
  });
});
