/* How its work: https://iqb-berlin.github.io/tba-info/intro/install/e2e.html section: Booklet-Config: */

import {
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  logoutTestTakerBkltConfig,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

describe('check values 2', { testIsolation: false }, () => {
  before(() => {
    disableSimplePlayersInternalDebounce();
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
    loginTestTaker('bklConfigValue2', '123', mode);
  });

  afterEach(() => {
    logoutTestTakerBkltConfig('hot_BkltConfigValue1');
  });

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

  it('presentation_complete: forward', () => {
    // value -1:  ALWAYS
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('abgespielt');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
  });

  it('presentation_complete: backward', () => {
    // value -1:  ALWAYS
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('abgespielt');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
  });

  it('responses_complete: forward', () => {
    // value -1:  ALWAYS
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('bearbeitet');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="page-navigation-backward"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
  });

  it('responses_complete: backward', () => {
    // value -1:  ALWAYS
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="page-navigation-backward"]')
      .click();
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('bearbeitet');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
  });

  it('allow_player_to_terminate_test', () => {
    // value -1:  LAST_UNIT
    getFromIframe('[data-cy="end-unit"]')
      .should('be.disabled');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    getFromIframe('[data-cy="end-unit"]')
      .should('be.enabled');
  });
});
