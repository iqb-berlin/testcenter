import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';
// TODO Alt vor UI/UX: unit_screenheader
describe('check parameter: header_content', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('BOOKLET_LABEL (default)', () => {
    loginTestTaker('Bklt_Config-11', '123');
    cy.get('[data-cy="header"]')
      .contains('Bklt-config-11');
  });

  it('NONE', () => {
    loginTestTaker('Bklt_Config-12', '123');
    cy.get('[data-cy=header] h1')
      .should('not.exist');
  });

  it('BLOCK_LABEL', () => {
    loginTestTaker('Bklt_Config-13', '123');
    cy.get('[data-cy="header"]')
      .contains('Aufgabenblock');
  });

  it('UNIT_LABEL', () => {
    loginTestTaker('Bklt_Config-14', '123');
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe1');
  });
});
