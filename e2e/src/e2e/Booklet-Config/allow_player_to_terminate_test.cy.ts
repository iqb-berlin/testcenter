import {
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

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
    loginTestTaker('bklConfigDefault', '123', mode);
    getFromIframe('[data-cy="end-unit"]')
      .should('be.enabled');
  });

  it('OFF', () => {
    loginTestTaker('bklConfigValue1', '123', mode);
    cy.contains('mat-dialog-container', 'Vollbild')
      .find('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
      .should('be.visible')
      .click();
    cy.contains('Aufgabe2')
    getFromIframe('[data-cy="end-unit"]')
      .should('be.disabled');
  });

  it('LAST_UNIT', () => {
    loginTestTaker('bklConfigValue2', '123', mode);
    getFromIframe('[data-cy="end-unit"]')
      .should('be.disabled');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    getFromIframe('[data-cy="end-unit"]')
      .should('be.enabled');
  });
});







