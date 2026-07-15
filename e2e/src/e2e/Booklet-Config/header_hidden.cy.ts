import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: header_hidden', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('FALSE (default)', () => {
    loginTestTaker('Bklt_Config-15', '123');
    cy.get('[data-cy="header"]')
      .should('be.visible');
  });

  it('TRUE', () => {
    loginTestTaker('Bklt_Config-16', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="header"]')
      .should('not.exist');
  });
});
