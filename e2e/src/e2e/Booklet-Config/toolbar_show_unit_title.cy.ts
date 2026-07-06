import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: toolbar_show_unit_title', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('TRUE (default)', () => {
    loginTestTaker('Bklt_Config-40', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('FALSE', () => {
    loginTestTaker('Bklt_Config-41', '123');
    cy.get('[data-cy="unit-title"]')
      .should('not.exist');
  });
});
