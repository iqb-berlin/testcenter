import {
  backwardsTo, getResultFileRows,
  deleteDownloadsFolder, forwardTo,
  getFromIframe, loginSuperAdmin,
  loginTestTaker, logoutAdmin, logoutTestTaker, openSampleWorkspace,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('Check hot-return mode functions', { testIsolation: false }, () => {
  // TODO Testfälle bzgl. Ticket #315 erstellen
  before(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    resetBackendData();
    deleteDownloadsFolder();
  });
  beforeEach(() => {
    visitLoginPage();
  });

  it('should be possible to start a hot-return-mode study as login: hret1', () => {
    loginTestTaker('hret1', '201', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.intercept(`${Cypress.env('urls').backend}/test/3/unit/UNIT.SAMPLE-101/response`).as('response-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    // todo: wenn nur response abgefangen wird, ist die Zeit zu kurz, die Checkbox ist nicht aktiv obwohl angeklickt.
    // Es müsste noch auf state abgefangen werden, dann ist die Zeit etwas länger und die Checkbox ist aktiv.
    // Der Status kommt dummerweise allerding nicht immer.
    cy.wait(1000);
    cy.wait('@response-1');
    forwardTo('Aufgabe2');
    cy.intercept(`${Cypress.env('urls').backend}/test/3/unit/UNIT.SAMPLE-102/response`).as('response-2');
    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .click();
    // todo: wenn nur response abgefangen wird, ist die Zeit zu kurz, die Checkbox ist nicht aktiv obwohl angeklickt.
    // Es müsste noch auf state abgefangen werden, dann ist die Zeit etwas länger und die Checkbox ist aktiv.
    // Der Status kommt dummerweise allerding nicht immer.
    cy.wait(1000);
    cy.wait('@response-2');
    backwardsTo('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
    cy.intercept(`${Cypress.env('urls').backend}/test/3/unit/UNIT.SAMPLE-102/state`).as('unit-102-state');
    forwardTo('Aufgabe2');
    cy.wait('@unit-102-state');
    logoutTestTaker('hot');
  });

  it('should restore the last given replies from login: hret1', () => {
    loginTestTaker('hret1', '201', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .should('be.checked');
    backwardsTo('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
    logoutTestTaker('hot');
  });

  it('should be possible to start a hot-return-mode study as login: hret2', () => {
    loginTestTaker('hret2', '202', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.intercept(`${Cypress.env('urls').backend}/test/4/unit/UNIT.SAMPLE-101/response`).as('response-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    cy.wait(1000);
    // todo: wenn nur response abgefangen wird, ist die Zeit zu kurz, die Checkbox ist nicht aktiv obwohl angeklickt.
    // Es müsste noch auf state abgefangen werden, dann ist die Zeit etwas länger und die Checkbox ist aktiv.
    // Der Status kommt dummerweise allerdings nicht immer.
    cy.wait('@response-1');
    forwardTo('Aufgabe2');
    cy.intercept(`${Cypress.env('urls').backend}/test/4/unit/UNIT.SAMPLE-102/response`).as('response-2');
    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .click();
    cy.wait(1000);
    // todo: wenn nur response abgefangen wird, ist die Zeit zu kurz, die Checkbox ist nicht aktiv obwohl angeklickt.
    // Es müsste noch auf state abgefangen werden, dann ist die Zeit etwas länger und die Checkbox ist aktiv.
    // Der Status kommt dummerweise allerding nicht immer.
    cy.wait(['@response-2']);
    backwardsTo('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
    cy.intercept(`${Cypress.env('urls').backend}/test/4/unit/UNIT.SAMPLE-102/state`).as('unit-102-state');
    forwardTo('Aufgabe2');
    cy.wait('@unit-102-state');
    logoutTestTaker('hot');
  });

  it('should restore the last given replies from login: hret2', () => {
    loginTestTaker('hret2', '202', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .should('be.checked');
    backwardsTo('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
    logoutTestTaker('hot');
  });

  it('should be a generated file (responses, logs) in the workspace with groupname: SM_HotModes', () => {
    loginSuperAdmin();
    openSampleWorkspace(1);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.contains('SessionManagement Hot-Modes-Test Logins');
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.get('[data-cy="download-responses"]')
      .click();
    logoutAdmin();
  });

  it('should be saved recent replies from login: hret1 in downloaded response file', () => {
    getResultFileRows('responses')
      .then(responses => {
        expect(responses[1]).to.be.match(/\bhret1\b/);
        expect(responses[1]).to.be.match(/\bUNIT.SAMPLE-101\b/);
        expect(responses[1]).to.be.match(/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/);
        expect(responses[2]).to.be.match(/\bhret1\b/);
        expect(responses[2]).to.be.match(/\bUNIT.SAMPLE-102\b/);
        expect(responses[2]).to.be.match(/\bid"":""radio2"",""status"":""VALUE_CHANGED"",""value"":""true\b/);
      });

    logoutAdmin();
  });

  it('should be saved recent replies from login: hret2 in downloaded response file', () => {
    getResultFileRows('responses')
      .then(responses => {
        expect(responses[3]).to.be.match(/\bhret2\b/);
        expect(responses[3]).to.be.match(/\bUNIT.SAMPLE-101\b/);
        expect(responses[1]).to.be.match(/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/);
        expect(responses[4]).to.be.match(/\bhret2\b/);
        expect(responses[4]).to.be.match(/\bUNIT.SAMPLE-102\b/);
        expect(responses[4]).to.be.match(/\bid"":""radio2"",""status"":""VALUE_CHANGED"",""value"":""true\b/);
      });

    logoutAdmin();
  });
});
