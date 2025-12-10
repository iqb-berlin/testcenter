import {
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: allow_player_to_terminate_test', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('ON (default)', () => {
    loginTestTaker('Bklt_Config-1', '123');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="end-unit"]')
      .should('be.enabled');
  });

  it('OFF', () => {
    loginTestTaker('Bklt_Config-2', '123');
    cy.contains('mat-dialog-container', 'Vollbild')
      .find('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
      .should('be.visible')
      .click();
    cy.contains('Aufgabe2');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="end-unit"]')
      .should('be.disabled');
  });

  it('LAST_UNIT', () => {
    loginTestTaker('Bklt_Config-3', '123');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="end-unit"]')
      .should('be.disabled');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="end-unit"]')
      .should('be.enabled');
  });
});






