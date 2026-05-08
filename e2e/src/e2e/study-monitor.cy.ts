import {
  deleteDownloadsFolder,
  loginMonitor,
  probeBackendApi,
  resetBackendData,
  visitLoginPage,
  clickCardButton
} from './utils';

describe('Study-Monitor User', () => {
  before(() => {
    deleteDownloadsFolder();
    resetBackendData();
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
