import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: toolbar_show_unit_list', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('FALSE (default)', () => {
    loginTestTaker('Bklt_Config-42', '123');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="unit-menu"]')
      .should('not.exist');
  });

  it('TRUE', () => {
    loginTestTaker('Bklt_Config-43', '123');
    cy.get('[data-cy="unit-menu"]')
      .should('be.visible');
  });
});
