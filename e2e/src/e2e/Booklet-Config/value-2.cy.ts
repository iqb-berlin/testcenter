/* How its work: https://iqb-berlin.github.io/tba-info/intro/install/e2e.html section: Booklet-Config: */

import {
  loginTestTaker,
  resetBackendData,
  getFromIframe,
  visitLoginPage,
  disableSimplePlayersInternalDebounce, reload, logoutTestTakerBkltConfig
} from '../utils';

const mode = 'test-hot';

describe('check values 2', { testIsolation: false }, () => {
  before(() => {
    disableSimplePlayersInternalDebounce();
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
    loginTestTaker('bklConfigValue2', '123', mode);
  });

  afterEach(() => {
    logoutTestTakerBkltConfig('hot_BkltConfigValue1');
  });

  /*
  it('unit_navibuttons', () => {
    // value -2:  ARROWS_ONLY
    cy.get('[data-cy="unit-nav-item:CY-Unit.Sample-101"]')
      .should('not.exist');
  });

  it('unit_screenheader', () => {
    // value -2:  WITH_UNIT_TITLE
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Test Bklt Configs value-2');
  });
*/
  it('presentation_complete', () => {
    // value -1:  ALWAYS
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('bearbeitet')
      .should('not.exist');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
 });

  it('responses_complete', () => {
    // value -1:  ON
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    getFromIframe('[data-cy="next-unit-page"]')
      .click();
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('bearbeitet');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    getFromIframe('[data-cy="previous-unit-page"]')
      .click();
  });

  it('allow_player_to_terminate_test', () => {
    // default:  OFF
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    getFromIframe('[data-cy="end-unit"]')
      .should('be.disabled');
  });
});
