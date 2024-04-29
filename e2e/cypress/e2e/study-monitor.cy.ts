import {
  deleteDownloadsFolder, loginStudyMonitor, resetBackendData, useTestDB, visitLoginPage
} from './utils';

describe('Study-Monitor User', () => {
  before(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    resetBackendData();
    deleteDownloadsFolder();
  });
  beforeEach(() => {
    useTestDB();
    visitLoginPage();
  });

  it('should be able to enter the site with study monitor', () => {
    loginStudyMonitor('tsm', '401');

    cy.get('[data-cy="SM-1"]')
      .should('exist')
      .click();
    cy.get('[data-cy="SM-table"]')
      .should('exist');
  });
});
