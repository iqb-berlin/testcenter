// TODO better selectors
// TODO test different network-measurements
// TODO mock backend responses for networktest to speed up things
// TODO test sending of a report

import {
  resetBackendData,
  selectFromDropdown,
  loginSuperAdmin,
  openSampleWorkspace,
  visitLoginPage,
  loginTestTaker,
  uploadFileFromFixtureToWorkspace,
  insertCredentials
} from '../utils';

describe('Sys-Check', () => {
  before(resetBackendData);
  beforeEach(visitLoginPage);

  it('start a system-check session', () => {
    cy.get('[data-cy="general-sys-check"]')
      .should('not.exist');
    insertCredentials('syscheck', '');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/w`);
  });

  it('the system-check button must be visible, if there is no sc-login in TT', () => {
    loginSuperAdmin();
    openSampleWorkspace(1);
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .contains('Löschen')
      .click();
    cy.get('[data-cy="SAMPLE_TESTTAKERS.XML"]')
      .should('not.exist');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile(`${Cypress.config('fixturesFolder')}/Testtakers_withoutSyscheck.xml`, { force: true });
    cy.contains('Erfolgreich hochgeladen');
    cy.contains('Testtakers_withoutSyscheck.xml');
    visitLoginPage();
    cy.get('[data-cy="general-sys-check"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/check-starter`);
  });

  it('start a system-check', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/r/check-starter`);
    cy.contains('System-Check Beispiel')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/w`);
    cy.get('#syscheck-next-step')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/n`);
    cy.contains('Netzwerk');
    cy.get('#syscheck-previous-step')
      .should('be.visible');
    cy.contains('Die folgenden Netzwerkeigenschaften wurden festgestellt: Ihre Verbindung zum Testserver ist gut.',
      { timeout: 60000 });
    cy.get('#syscheck-next-step')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/u`);
    cy.contains('Bitte prüfen Sie die folgenden Aufgaben-Elemente');
    cy.get('#syscheck-next-step')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/q`);
    cy.get('[data-cy="input-name"]')
      .type('Test-Input1');
    selectFromDropdown('Auswahl', 'Option A');
    cy.get('[data-cy="textarea"]')
      .type('Test-Input2');
    cy.get('[data-cy="checkbox"]')
      .click();
    cy.get('[data-cy="Option B"]')
      .find('label')
      .click();
    cy.get('#syscheck-next-step')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/r`);
    cy.contains('Eingabefeld: Test-Input1');
    cy.contains('Auswahl: Option A');
    cy.contains('Eingabebereich: Test-Input2');
    cy.contains('Kontrollkästchen: true');
    cy.contains('Optionsfelder: Option B');
    cy.contains('System-Check abbrechen')
      .click();
    cy.url().should('contain', `${Cypress.config().baseUrl}/#/r`);
  });

  it('to save a report all required fields must be filled out', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/r/check-starter`);
    cy.contains('System-Check Beispiel')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/w`);
    cy.get('#syscheck-next-step')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/n`);
    cy.contains('Netzwerk');
    cy.get('#syscheck-previous-step')
      .should('be.visible');
    cy.contains('Die folgenden Netzwerkeigenschaften wurden festgestellt: Ihre Verbindung zum Testserver ist gut.',
      { timeout: 60000 });
    cy.get('#syscheck-next-step')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/u`);
    cy.contains('Bitte prüfen Sie die folgenden Aufgaben-Elemente');
    cy.get('#syscheck-next-step')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/q`);

    cy.get('#syscheck-next-step')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/r`);
    cy.contains('Bitte prüfen Sie die Eingaben (unvollständig)');
  });

  it('show the starter page if more than one system-check is available in workspace', () => {
    uploadFileFromFixtureToWorkspace('SysCheck_correct.xml', 1);
    loginTestTaker('syscheck', '', 'starter');
    cy.get('[data-cy*="syscheck"').should('have.length', 2);
  });
});
