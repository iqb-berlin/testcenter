import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

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
    loginTestTaker('bklConfigDefault', '123', mode);
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe1')
      .should('not.exist');
  });

  it('WITH_UNIT_TITLE', () => {
    loginTestTaker('bklConfigValue1', '123', mode);
    cy.contains('mat-dialog-container', 'Vollbild')
      .find('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe1');
  });

  it('WITH_BOOKLET_TITLE', () => {
    loginTestTaker('bklConfigValue2', '123', mode);
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Test Bklt Configs value-2');
  });

  it('WITH_BLOCK_TITLE', () => {
    loginTestTaker('bklConfigValue3', '123', mode);
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabenblock');
  });
});

