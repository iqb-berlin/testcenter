
describe('Perform a system check', () => {
  it('should exist', () => {
    cy.visit('http://localhost:4200/#/r/check-starter');
    cy.contains('System-Check Auswahl')
      .should('exist');
    cy.contains('An example SysCheck definition')
      .should('exist');
  })

  it('Run through the whole system-check', () => {
    cy.visit('http://localhost:4200/#/r/check-starter');
    cy.contains('An example SysCheck definition')
      .click();
    cy.url().should('eq', 'http://localhost:4200/#/check/1/SYSCHECK.SAMPLE/w');
    cy.get('button.mat-focus-indicator:nth-child(3)')
      .click();
    cy.url().should('eq', 'http://localhost:4200/#/check/1/SYSCHECK.SAMPLE/n');
    cy.contains('Netzwerk')
      .should('exist');
    cy.contains('Die folgenden Netzwerkeigenschaften wurden festgestellt: Ihre Verbindung zum Testserver ist gut.', { timeout: 20000 });
    cy.get('button.mat-focus-indicator:nth-child(3)')
      .click();
    cy.url().should('eq', 'http://localhost:4200/#/check/1/SYSCHECK.SAMPLE/u');
    cy.contains('Bitte prüfen Sie die folgenden Aufgaben-Elemente');
    cy.get('button.mat-focus-indicator:nth-child(3)')
      .click();
    cy.url().should('eq', 'http://localhost:4200/#/check/1/SYSCHECK.SAMPLE/q');
    cy.get('#\\32')
      .type('Test-Input1');
    cy.get('.mat-select-arrow')
      .click()
      .get('#mat-option-0 > span:nth-child(1)')
      .click();
    cy.get('#\\34')
      .type('Test-Input2')
    cy.get('.mat-checkbox-inner-container')
      .click();
    cy.get('#mat-radio-3 > label:nth-child(1) > span:nth-child(1)')
      .click();
    cy.get('button.mat-focus-indicator:nth-child(3)')
      .click();
    cy.url().should('eq', 'http://localhost:4200/#/check/1/SYSCHECK.SAMPLE/r');
    cy.contains(' Name: Test-Input1 ');
    cy.contains(' Who am I?: Harvy Dent ');
    cy.contains(' Why so serious?: Test-Input2 ');
    cy.contains(' Check this out: true ');
    cy.contains(' All we here is: Radio Gugu ');
    cy.contains('System-Check Abbrechen')
      .click();
    cy.url().should('eq', 'http://localhost:4200/#/r/check-starter');
  })
})

