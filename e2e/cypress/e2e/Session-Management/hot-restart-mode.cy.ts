import {
  convertResultsLoginRows, convertResultsSeperatedArrays,
  deleteDownloadsFolder,
  getFromIframe, loginSuperAdmin,
  loginTestTaker, logoutTestTaker, openSampleWorkspace1,
  resetBackendData,
  useTestDB,
  visitLoginPage
} from '../utils';

let idHres1;
let idHres2;

describe.skip('Check hot-restart-mode functions', () => {
  // todo: waits beim Setzen der Checkboxen ersetzen
  // abfangen der Calls schwierig, Test scheitert manchmal--> Optimierung nach Änderungen durch Philipp
  before(resetBackendData);
  before(deleteDownloadsFolder);
  beforeEach(() => {
    useTestDB();
    visitLoginPage();
  });

  it('should be possible to start a hot-restart-mode study as login: hres1', () => {
    loginTestTaker('hres1', '203');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/state`).as('testState');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/unit/UNIT.SAMPLE-101/state`).as('unitState101');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/log`).as('testLog');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/commands`).as('commands');
    cy.contains('Sessionmanagement test hot modes')
      .should('exist');
    cy.contains(/^Starten$/)
      .should('exist');
    cy.get('[data-cy="booklet-SM_BKL"]')
      .should('exist')
      .click();
    cy.wait(['@testState', '@unitState101', '@unitState101', '@unitState101', '@testLog', '@commands']);
    cy.contains(/^Aufgabe1$/)
      .should('exist');
    cy.wait(1000);
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('exist')
      .click()
      .should('be.checked');
    cy.wait(1000);
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/unit/UNIT.SAMPLE-102/state`).as('unitState102');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/unit/UNIT.SAMPLE-102/response`).as('unitResponse102');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('exist')
      .click();
    cy.contains(/^Aufgabe2$/)
      .should('exist');
    cy.wait(['@unitState102', '@unitState102', '@unitResponse102']);
    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .should('exist')
      .click()
      .should('be.checked');
    cy.wait(1000);
    logoutTestTaker('hot');
  });

  it('should be a generated file (responses, logs) in the workspace with groupname: SM_HotModes', () => {
    loginSuperAdmin();
    openSampleWorkspace1();
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .should('exist')
      .click();
    cy.contains('SM_HotModes')
      .should('exist');
    cy.get('[data-cy="results-checkbox1"]')
      .should('exist')
      .click();
    cy.get('[data-cy="download-responses"]')
      .should('exist')
      .click();
  });

  it('should be saved recent replies from first login: hres1 in downloaded response file', () => {
    convertResultsLoginRows('responses')
      .then(responses => {
        expect(responses[1]).to.be.match(/\bhres1\b/);
        expect(responses[1]).to.be.match(/\bUNIT.SAMPLE-101\b/);
        expect(responses[1]).to.be.match(/\bradio1"":""true\b/);
        expect(responses[2]).to.be.match(/\bhres1\b/);
        expect(responses[2]).to.be.match(/\bUNIT.SAMPLE-102\b/);
        expect(responses[2]).to.be.match(/\bradio2"":""true\b/);
      });
  });

  it('should be possible to start a new hot-restart-mode study with the same login: hres1', () => {
    loginTestTaker('hres1', '203');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/state`).as('testState');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/unit/UNIT.SAMPLE-101/state`).as('unitState101');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/log`).as('testLog');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/commands`).as('commands');
    cy.contains('Sessionmanagement test hot modes')
      .should('exist');
    cy.contains(/^Starten$/)
      .should('exist');
    cy.get('[data-cy="booklet-SM_BKL"]')
      .should('exist')
      .click();
    cy.wait(['@testState', '@unitState101', '@unitState101', '@testLog', '@commands']);
    cy.contains(/^Aufgabe1$/)
      .should('exist');
    cy.wait(1000);
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('exist')
      .should('not.be.checked')
      .click()
      .should('be.checked');
    cy.wait(1000);
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/unit/UNIT.SAMPLE-102/state`).as('unitState102');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('exist')
      .click();
    cy.contains(/^Aufgabe2$/)
      .should('exist');
    cy.wait(['@unitState102', '@unitState102']);
    getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
      .should('exist')
      .should('not.be.checked')
      .click()
      .should('be.checked');
    cy.wait(1000);
    logoutTestTaker('hot');
  });

  it('should be a newer generated file (responses, logs) in the workspace with groupname: SM_HotModes', () => {
    loginSuperAdmin();
    openSampleWorkspace1();
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .should('exist')
      .click();
    cy.get('[data-cy="results-checkbox1"]')
      .should('exist')
      .click();
    cy.get('[data-cy="download-responses"]')
      .should('exist')
      .click();
  });

  it('should be saved recent replies from second login: hres1 in downloaded response file', () => {
    convertResultsLoginRows('responses')
      .then(responses => {
        expect(responses[3]).to.be.match(/\bhres1\b/);
        expect(responses[3]).to.be.match(/\bUNIT.SAMPLE-101\b/);
        expect(responses[3]).to.be.match(/\bradio1"":""true\b/);
        expect(responses[4]).to.be.match(/\bhres1\b/);
        expect(responses[4]).to.be.match(/\bUNIT.SAMPLE-102\b/);
        expect(responses[4]).to.be.match(/\bradio1"":""true\b/);
      });
  });

  it('should be generated a different ID for each hres-login', () => {
    // save the generated ID from first hres-login
    convertResultsSeperatedArrays('responses')
      .then(LoginID => {
        idHres1 = LoginID[1][2];
      });
    // save the generated ID from second hres-login
    convertResultsSeperatedArrays('responses')
      .then(LoginID => {
        idHres2 = LoginID[2][2];
      });

    expect(idHres1).to.be.not.equal(idHres2);
  });
});