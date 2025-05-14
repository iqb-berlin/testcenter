/* ##################### check booklet configuration first value option ############################## */
/* https://iqb-berlin.github.io/tba-info/intro/install/e2e.html section: Booklet-Config:
--> Here you can find an overview of all booklet configuration parameters that are tested here */

import {
  loginTestTaker,
  resetBackendData,
  logoutTestTaker,
  getFromIframe,
  visitLoginPage,
  disableSimplePlayersInternalDebounce
} from '../utils';

const mode = 'test-hot';

describe('check default values', { testIsolation: false }, () => {
  before(() => {
    disableSimplePlayersInternalDebounce();
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
    loginTestTaker('bklConfigValue1', '123', mode);
  });

  afterEach(() => {
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    getFromIframe('[data-cy="next-unit-page"]')
      .click();
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="endTest-1"]')
      .click();
    cy.get('[data-cy="logout"]')
      .click();
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

  it('presentation_complete', () => {
    // value -1:  ON
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('abgespielt');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
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
});
