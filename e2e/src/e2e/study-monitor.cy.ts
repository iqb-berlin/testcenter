import {
  deleteDownloadsFolder,
  loginMonitor,
  resetBackendData,
  visitLoginPage
} from './utils';

describe('Study-Monitor User', () => {
  before(() => {
    deleteDownloadsFolder();
    cy.clearLocalStorage();
    cy.clearCookies();
    resetBackendData();
  });
  beforeEach(() => {
    visitLoginPage();
  });

  it('start a study monitor', () => {
    loginMonitor('tsm', '401');

    cy.get('[data-cy="SM-1"]')
      .should('exist')
      .click();
    cy.get('[data-cy="SM-table"]')
      .should('exist');
  });
});