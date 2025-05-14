/* ##################### check booklet configuration default values ############################## */
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
    loginTestTaker('bklConfigDefault', '123', mode);
  });

  afterEach(() => {
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
    // default: OFF
    cy.get('[data-cy="dialog-cancel"]')
      .should('not.exist');
  });

  it('unit_show_time_left', () => {
    // default: OFF
    cy.get('[data-cy="time-value"]')
      .should('not.exist');
  });

  it('unit_time_left_warnings', () => {
    // default: warning message will be displayed when one minute remains
    cy.wait(61000);
    cy.get('.snackbar-timerWarning');
  });

  it('page_navibutton', () => {
    // default:  SEPARATE_BOTTOM
    cy.get('[data-cy="page-navigation-0"]');
  });

  it('unit_navibuttons', () => {
    // default:  FULL
    cy.get('[data-cy="unit-navigation-forward"]');
  });

  it('unit_menu', () => {
    // default:  OFF
    cy.get('[data-cy="unit-menu"]')
      .should('not.exist');
  });

  it('show_fullscreen_button', () => {
    // default:  OFF
    cy.get('[data-cy="fullscreen"]')
      .should('not.exist');
  });

  it('unit_title', () => {
    // default:  ON
    cy.get('[data-cy="unit-title"]');
  });

  it('unit_screenheader', () => {
    // default:  EMPTY
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe1')
      .should('not.exist');
  });

  it('presentation_complete', () => {
    // default:  OFF
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('abgespielt')
      .should('not.exist');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
  });

  it('responses_complete', () => {
    // default:  OFF
    getFromIframe('[data-cy="next-unit-page"]')
      .click();
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('bearbeitet')
      .should('not.exist');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
  });
});
