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
    cy.get('[data-cy="dialog-title"]')
      .contains('Sicher, dass du den Test beenden möchtest?')
      .should('be.visible');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    clickCardButton('booklet', 'Bklt-config-17', 'Weiter');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('ON: End Test via Logo', () => {
    loginTestTaker('Bklt_Config-18', '123');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Sicher, dass du den Test beenden möchtest?')
      .should('be.visible');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="booklet-CY-BKLT_BKLTCONFIG-18"]')
      .contains('Fertig');
  });

  it('ON: End Test via Unit-Menu', () => {
    loginTestTaker('Bklt_Config-18', '123');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="endTest"]')
      .click({force: true});
    cy.get('[data-cy="booklet-CY-BKLT_BKLTCONFIG-18"]')
      .contains('Fertig');
  });
});
