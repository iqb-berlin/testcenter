import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

describe('check parameter: unit-navibutton', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('FULL (default)', () => {
    loginTestTaker('Bklt_Config-1', '123', mode);
    cy.get('[data-cy="unit-navigation-forward"]');
  });

  it('OFF', () => {
    loginTestTaker('Bklt_Config-2', '123', mode);
    cy.contains('mat-dialog-container', 'Vollbild')
      .find('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('not.exist');
  });

  it('ARROWS_ONLY', () => {
    loginTestTaker('Bklt_Config-3', '123', mode);
    cy.get('[data-cy="unit-nav-item:CY-Unit.Sample-101"]')
      .should('not.exist');
  });

  it('FORWARD_ONLY', () => {
    loginTestTaker('Bklt_Config-4', '123', mode);
    cy.get('[data-cy="unit-navigation-forward"]');
    cy.get('[data-cy="unit-navigation-backward"]')
      .should('not.exist');
  });
});






