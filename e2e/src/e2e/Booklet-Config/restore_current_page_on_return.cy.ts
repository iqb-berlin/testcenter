import {
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  probeBackendApi,
  reload,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

describe('check parameter: restore_current_page_on_return', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('OFF (default)', () => {
    loginTestTaker('bklConfigDefault', '123', mode);
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    cy.wait(1000); // wait for debounce
    reload();
    cy.get('[data-cy="page-navigation-0"]')
      .children()
      .should('have.attr', 'aria-checked', 'true');
  });

  it('ON', () => {
    loginTestTaker('bklConfigValue1', '123', mode);
    cy.contains('mat-dialog-container', 'Vollbild')
      .find('[data-cy="dialog-cancel"]')
      .click();
    getFromIframe('[data-cy="next-unit-page"]')
      .click();
    cy.wait(1000); // wait for debounce
    reload();
    cy.wait(1000);
    getFromIframe('[data-pagenr="2"]')
      .should('have.attr', 'style', 'display: block;');
    getFromIframe('[data-cy="previous-unit-page"]')
      .click();
  });
});







