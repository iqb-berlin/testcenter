import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: page-navibutton', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('SEPARATE_BOTTOM (default)', () => {
    loginTestTaker('Bklt_Config-1', '123');
    cy.get('[data-cy="page-navigation-0"]');
  });

  it('OFF', () => {
    loginTestTaker('Bklt_Config-2', '123');
    cy.contains('mat-dialog-container', 'Vollbild')
      .find('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="page-navigation-0"]')
      .should('not.exist');
  });
});






