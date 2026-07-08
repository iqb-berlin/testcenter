import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: toolbar_show_reload_button', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('FALSE (default)', () => {
    loginTestTaker('Bklt_Config-46', '123');
    cy.get('[data-cy="toolbar-right"]')
      .should('not.be.visible');
  });

  it('TRUE', () => {
    loginTestTaker('Bklt_Config-47', '123');
    cy.get('[data-cy="toolbar-right"]')
      .click();
    cy.get('[data-cy="reloadPage"]')
      .click();
  });
});
