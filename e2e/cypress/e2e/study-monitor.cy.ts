import {
  deleteDownloadsFolder, loginMonitor, resetBackendData, visitLoginPage
} from './utils';

describe('Study-Monitor User', () => {
  before(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    resetBackendData();
    deleteDownloadsFolder();
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