import {
  cleanUp,
  disableSimplePlayersInternalDebounce,
  forwardTo,
  loginTestTaker,
  probeBackendApi,
  resetBackendTestData,
  visitLoginPage,
  getFromIframe,
  logout,
  loginSuperAdmin,
  openWorkspace,
  selectResultGroup, logoutAdmin
} from '../utils';

describe('Check calculator booklet position', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    resetBackendTestData();
    probeBackendApi();
    visitLoginPage();
    disableSimplePlayersInternalDebounce();
    loginTestTaker('CalcWdgt-1', '123');
  });

  it('first unit: there is no calculator', () => {
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe 1');
    cy.get('[data-cy="toolbar-widget"]')
      .should('not.exist');
  });

  it('second unit: there is a calculator inherited from testlet', () => {
    forwardTo('Aufgabe 2');
    cy.get('[data-cy="toolbar-widget"]')
      .should('exist');
  });

  it('third unit: there is a calculator', () => {
    forwardTo('Aufgabe 3');
    cy.get('[data-cy="toolbar-widget"]')
      .should('exist');
  });

  it('fourth unit: there is no calculator', () => {
    forwardTo('Aufgabe 4');
    cy.get('[data-cy="toolbar-widget"]')
      .should('not.exist');
  });
});

describe('Check log files for the calculator result', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    resetBackendTestData();
    probeBackendApi();
    visitLoginPage();
    disableSimplePlayersInternalDebounce();
    loginTestTaker('CalcWdgt-2', '123');
  });

  it('a simple addition', () => {

    cy.get('[data-cy="toolbar-widget"]')
      .click();
    cy.get('.widget-window iframe')
      .should('exist');
    getFromIframe('.widget-window iframe')
      .as('calc');
    cy.get('@calc')
      .find('button:contains("5")')
      .click();
    cy.get('@calc')
      .find('button[title="Addition"]')
      .click();
    cy.get('@calc')
      .find('button:contains("3")')
      .click();
    cy.get('@calc')
      .find('button[title="Rechnung dezimal ausführen"]')
      .click();
  });

  it('close calculator widget', () => {
    cy.get('[data-cy="toolbar-widget"]')
      .click();
    cy.get('.widget-window')
      .find('button[mat-dialog-close]')
      .click();
    cy.get('.widget-window')
      .should('not.exist');
    cy.get('[data-cy="calculator-peek-close"]')
      .click();
  });

  it('logfiles download', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Sicher, dass du den Test beenden möchtest?')
      .should('be.visible');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    logout();
    visitLoginPage();
    loginSuperAdmin();
    openWorkspace('workspace-card-sample_workspace', 1);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    selectResultGroup('Calc-Widget');
    cy.intercept('GET', `${Cypress.env('urls').backend}/workspace/1/report/log?*`).as('waitForDownloadLogs');
    cy.get('[data-cy="download-logs"]')
      .click();
    cy.wait('@waitForDownloadLogs');
    logoutAdmin();
  });

  it('check logfile', () => {
    cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-logs.csv`)
      .should('include', 'CALCULATOR_CALCULATION = ""5+3=8""');
  });
});


