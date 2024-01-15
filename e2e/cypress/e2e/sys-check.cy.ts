// TODO better selectors
// TODO test different network-measurements
// TODO mock backend responses for networktest to speed up things
// TODO test sending of a report

import { resetBackendData, selectFromDropdown, useTestDB } from './utils';

describe('Sys-Check', () => {
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
  it('should exist', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/r/check-starter`);
    cy.contains('System-Check Auswahl')
      .should('exist');
    cy.contains('Beschreibungstext für den Systemcheck')
      .should('exist');
  });

  it('Run through the whole system-check', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/r/check-starter`);
    cy.contains('System-Check Beispiel')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/w`);
    cy.get('#syscheck-next-step')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/n`);
    cy.contains('Netzwerk')
      .should('exist');
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
    cy.contains('System-Check Abbrechen')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/check-starter`);
  });
});
