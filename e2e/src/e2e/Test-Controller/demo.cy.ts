import {
  backwardsTo,
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginSuperAdmin,
  openWorkspace,
  probeBackendApi,
  resetBackendTestData,
  visitLoginPage, cleanUp, logoutFromTestNoConfirmation, twoStepLogin
} from '../utils';

describe('run a demo test, check time block dialogs', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    resetBackendTestData();
    probeBackendApi();
    visitLoginPage();
    disableSimplePlayersInternalDebounce();
    twoStepLogin('Test_Ctrl-1a', '123');
    cy.url().should('contain', `${Cypress.config().baseUrl}/#/t/`);
  });

  it('Complete Aufgabe 1', () => {
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('.snackbar-time-started')
      .contains('Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    // some time to ensure that the answer is saved
    cy.wait(1000);
  });

  it('Complete Aufgabe 2', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg2"]')
      .click()
      .should('be.checked');
    // some time to ensure that the answer is saved
    cy.wait(1000);
  });

 it('verify that the last answer is there', () => {
   backwardsTo('Aufgabe1');
   getFromIframe('iframe.unitHost')
    .find('[data-cy="TestController-radio1-Aufg1"]')
    .should('be.checked');
  });

  it('start the booklet again after exiting the test', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('zeitbegrenzten Blocks');
    cy.get('[data-cy="toast-action-0"]')
      .click({ force: true });
    cy.get('[data-cy="booklet-CY-BKLT_TC-1A"]')
      .contains('Weiter')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });

  it('the last answers is no longer exist', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .should('not.be.checked');
  });

  it('navigate back to the booklet view and check out', () => {
    logoutFromTestNoConfirmation();
  });

  it('a response file is not generated', () => {
    visitLoginPage();
    loginSuperAdmin();
    openWorkspace('workspace-card-sample_workspace', 1);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.contains('Demo');
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.get('[data-cy="download-responses"]')
      .click();
    cy.contains('Keine Daten verfügbar');
  });
});

describe('check code word guidelines', { testIsolation: true }, () => {
  before(() => {
    cleanUp();
    resetBackendTestData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('show the current code word: text-field', () => {
    twoStepLogin('Test_Ctrl-1b', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('Das Freigabewort lautet Hase');
    cy.get('[data-cy="code-input"]')
      .type('Hase');
    cy.get('[data-cy="continue"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="toast-action-0"]')
      .click({ force: true });
    cy.get('[data-cy="toast-item"]')
      .should('not.exist');
    cy.get('.snackbar-time-started')
      .contains('Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min');
  });

  it('show the current code word: keypad-symbols', () => {
    twoStepLogin('Test_Ctrl-1c', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('Das Freigabewort lautet 123');
    cy.get('[data-cy="code-btn-1"]')
      .click();
    cy.get('[data-cy="code-btn-2"]')
      .click();
    cy.get('[data-cy="code-btn-3"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="toast-action-0"]')
      .click({ force: true });
    cy.get('[data-cy="toast-item"]')
      .should('not.exist');
  });

  it('show the current code word: keypad-numbers', () => {
    twoStepLogin('Test_Ctrl-1d', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('Das Freigabewort lautet 123');
    cy.get('[data-cy="code-btn-1"]')
      .click();
    cy.get('[data-cy="code-btn-2"]')
      .click();
    cy.get('[data-cy="code-btn-3"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="toast-action-0"]')
      .click({ force: true });
    cy.get('[data-cy="toast-item"]')
      .should('not.exist');
  });
});

describe('check deny navigation dialogs', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    resetBackendTestData();
    probeBackendApi();
    visitLoginPage();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('presentation/response-complete ON', () => {
    twoStepLogin('Test_Ctrl-1e', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('abgespielt')
      .and('contain', 'bearbeitet');
    cy.get('[data-cy="toast-action-0"]')
      .click({ force: true});
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="toast-item-0"]')
      .should('not.exist');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('presentation/response-complete ALWAYS', () => {
    twoStepLogin('Test_Ctrl-1f', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('abgespielt')
      .and('contain', 'bearbeitet');
    cy.get('[data-cy="toast-action-0"]')
      .click({ force: true});
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('abgespielt')
      .and('contain', 'bearbeitet');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });
});

