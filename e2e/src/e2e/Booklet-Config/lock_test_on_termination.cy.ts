import {
  disableSimplePlayersInternalDebounce, getFromIframe,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage,
  clickCardButton
} from '../utils';

describe('check parameter: lock_test_on_termination', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('OFF (default)', () => {
    loginTestTaker('Bklt_Config-17', '123');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="endTest-1"]')
      .click();
    clickCardButton('booklet', 'Bklt-config-17', 'Weiter');
  });

  it('ON', () => {
    loginTestTaker('Bklt_Config-18', '123');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="endTest-1"]')
      .click();
    cy.get('[data-cy="booklet-CY-BKLT_BKLTCONFIG-18"]')
      .contains('Fertig');
  });
});
