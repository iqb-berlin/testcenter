import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: unit-screenheader', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('EMPTY (default)', () => {
    loginTestTaker('Bklt_Config-1', '123');
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe1')
      .should('not.exist');
  });

  it('WITH_UNIT_TITLE', () => {
    loginTestTaker('Bklt_Config-2', '123');
    cy.contains('mat-dialog-container', 'Vollbild')
      .find('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe1');
  });

  it('WITH_BOOKLET_TITLE', () => {
    loginTestTaker('Bklt_Config-3', '123');
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Bklt-config-3');
  });

  it('WITH_BLOCK_TITLE', () => {
    loginTestTaker('Bklt_Config-4', '123');
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabenblock');
  });
});

