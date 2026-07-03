import {
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  probeBackendApi,
  reload,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: restore_current_page_on_return', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('OFF (default)', () => {
    loginTestTaker('Bklt_Config-27', '123');
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.disabled');
    cy.wait(1000); // wait for debounce
    reload();
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.enabled');
  });

  it('ON', () => {
    loginTestTaker('Bklt_Config-28', '123');
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.disabled');
    cy.wait(1000); // wait for debounce
    reload();
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.disabled');
  });
});




