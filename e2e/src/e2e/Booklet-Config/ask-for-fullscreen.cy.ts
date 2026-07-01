import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: ask-for-fullscreen', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('OFF (default)', () => {
    loginTestTaker('Bklt_Config-1', '123');
    cy.get('body')
      .should('not.contain', 'Vollbild');
  });

  it('ON', () => {
    loginTestTaker('Bklt_Config-2', '123');
    cy.get('[data-cy="dialog-title"]')
      .contains('Vollbild');
  });
});
