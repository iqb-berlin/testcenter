import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendTestData,
  visitLoginPage
} from '../utils';

describe('custom texts from the booklet', { testIsolation: true }, () => {
  before(() => {
    resetBackendTestData();
    probeBackendApi();
  });

  beforeEach(() => {
    visitLoginPage();
    disableSimplePlayersInternalDebounce();
    loginTestTaker('Test_Ctrl-22', '123');
  });

  it('end test dialog: show the custom title', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('have.text', 'Befragung beenden?');
  });
});
