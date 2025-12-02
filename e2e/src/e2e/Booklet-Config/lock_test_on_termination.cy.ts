import {
  disableSimplePlayersInternalDebounce, getFromIframe,
  loginTestTaker,
  probeBackendApi, reload,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

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
    loginTestTaker('Bklt_Config-1', '123', mode);
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="endTest-1"]')
      .click();
    cy.get('[data-cy="booklet-CY-BKLT_BKLTCONFIG-1"]')
      .contains('Fortsetzen')
      .click();
  });

  it('ON', () => {
    loginTestTaker('Bklt_Config-2', '123', mode);
    cy.contains('mat-dialog-container', 'Vollbild')
      .find('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="endTest-1"]')
      .click();
    cy.get('[data-cy="booklet-CY-BKLT_BKLTCONFIG-2"]')
      .contains('gesperrt');
  });
});






