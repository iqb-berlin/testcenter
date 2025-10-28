/* How its work: https://iqb-berlin.github.io/tba-info/intro/install/e2e.html section: Booklet-Config: */

import {
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  logoutTestTakerBkltConfig,
  probeBackendApi,
  reload,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

describe('check values 1', { testIsolation: false }, () => {
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
    loginTestTaker('bklConfigValue1', '123', mode);
  });

  afterEach(() => {
    logoutTestTakerBkltConfig('hot_BkltConfigValue1');
  });

  it('ask_for_fullscreen', () => {
    // value-1: ON
    cy.get('[data-cy="dialog-cancel"]')
      .click();
  });

  it('unit_show_time_left', () => {
    // value-1: ON
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="time-value"]')
      .should('exist');
  });

  it('page_navibutton', () => {
    // value -1:  OFF
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="page-navigation-0"]')
      .should('not.exist');
  });

  it('unit_navibuttons', () => {
    // value -1:  OFF
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('not.exist');
  });

  it('unit_menu', () => {
    // value -1:  FULL
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="unit-menu"]');
  });

  it('show_fullscreen_button', () => {
    // value -1:  ON
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="fullscreen"]');
  });

  it('unit_title', () => {
    // value -1:  OFF
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .should('not.exist');
  });

  it('unit_screenheader', () => {
    // value -1:  WITH_UNIT_TITLE
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe1');
  });

  it('presentation_complete: forward', () => {
    // value -1:  ON
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('abgespielt');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    getFromIframe('[data-cy="next-unit-page"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    getFromIframe('[data-cy="previous-unit-page"]')
      .click();
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe1"]')
      .click();
  });

  it('presentation_complete: backward', () => {
    // value -1:  ON
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    getFromIframe('[data-cy="next-unit-page"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    getFromIframe('[data-cy="previous-unit-page"]')
      .click();
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe1"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
  });

  it('responses_complete: forward', () => {
    // value -1:  ON
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    getFromIframe('[data-cy="next-unit-page"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('bearbeitet');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    getFromIframe('[data-cy="previous-unit-page"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe1"]')
      .click();

  });

  it('responses_complete: backward', () => {
    // value -1:  ON
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    getFromIframe('[data-cy="next-unit-page"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    getFromIframe('[data-cy="previous-unit-page"]')
      .click();
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
      .click();
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe1"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
  });

  it('allow_player_to_terminate_test', () => {
    // default:  OFF
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    getFromIframe('[data-cy="end-unit"]')
      .should('be.disabled');
  });

  it('restore_current_page_on_return', () => {
    // default:  ON
    cy.get('[data-cy="dialog-cancel"]')
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

  it('lock_test_on_termination', () => {
    // default:  ON
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    getFromIframe('[data-cy="next-unit-page"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="endTest-1"]')
      .click();
    cy.get('[data-cy="booklet-CY-BKLTCONFIGVALUE-1"]')
      .contains('gesperrt');
  });
});
