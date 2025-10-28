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

describe('check default values', { testIsolation: false }, () => {
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
    loginTestTaker('bklConfigDefault', '123', mode);
  });

  afterEach(() => {
    logoutTestTakerBkltConfig('hot_BkltConfigDefault');
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
    // snackbar will be showed 1 second before the time is expiried
    // because the testlet have a
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

  it('presentation_complete: forward', () => {
    // default:  OFF
    cy.get('[data-cy="unit-navigation-forward"]');
    cy.get('[data-cy="dialog-content"]')
      .should('not.exist');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
  });

  it('presentation_complete: backward', () => {
    // default:  OFF
    cy.get('[data-cy="unit-navigation-forward"]');
    cy.get('[data-cy="unit-navigation-backward"]');
    cy.get('[data-cy="dialog-content"]')
      .should('not.exist');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
  });

  it('responses_complete: forward', () => {
    // default:  OFF
    cy.get('[data-cy="unit-navigation-forward"]');
    cy.get('[data-cy="dialog-content"]')
      .should('not.exist');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
  });

  it('responses_complete: backward', () => {
    // default:  OFF
    cy.get('[data-cy="unit-navigation-forward"]');
    cy.get('[data-cy="unit-navigation-backward"]');
    cy.get('[data-cy="dialog-content"]')
      .should('not.exist');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
  });

  it('allow_player_to_terminate_test', () => {
    // default:  ON
    getFromIframe('[data-cy="end-unit"]')
      .should('be.enabled');
  });

  it('restore_current_page_on_return', () => {
    // default:  OFF
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    cy.wait(1000); // wait for debounce
    reload();
    cy.get('[data-cy="page-navigation-0"]')
      .children()
      .should('have.attr', 'aria-pressed', 'true');
  });

  it('lock_test_on_termination', () => {
    // default:  OFF
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="endTest-1"]')
      .click();
    cy.get('[data-cy="booklet-CY-BKLTCONFIGDEFAULTS"]')
      .contains('Fortsetzen')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Endseite');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="endTest-1"]')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
  });

});
