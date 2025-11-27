import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

describe('check parameter: shown-fullscreen-button', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('OFF (default)', () => {
    loginTestTaker('Bklt_Config-1', '123', mode);
    cy.get('[data-cy="fullscreen"]')
      .should('not.exist');
  });

  it('ON', () => {
    loginTestTaker('Bklt_Config-2', '123', mode);
    cy.contains('mat-dialog-container', 'Vollbild')
      .find('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="fullscreen"]');
  });
});







