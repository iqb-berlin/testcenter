import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';
// TODO warten bis UI/UX Änderungen final umgesetzt, aktuell wird bei OFF die Seitennavigation noch nicht ausgeschaltet, daher Test erst einmal raus genommen
describe.skip('check parameter: page-navibutton', { testIsolation: true }, () => {
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
    cy.get('[data-cy="page-navigation-forward"]');
  });

  it('OFF', () => {
    loginTestTaker('Bklt_Config-2', '123');
    cy.contains('mat-dialog-container', 'Vollbild')
      .find('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .should('not.exist');
  });
});




