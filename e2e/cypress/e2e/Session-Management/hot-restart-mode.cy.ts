import {
  getResultFileRows, convertResultsSeperatedArrays,
  deleteDownloadsFolder,
  getFromIframe, loginSuperAdmin,
  loginTestTaker, logoutTestTaker, openSampleWorkspace,
  resetBackendData,
  visitLoginPage,
  forwardTo,
  logoutAdmin

} from '../utils';

let idHres1;
let idHres2;

describe('Check hot-restart-mode functions', { testIsolation: false }, () => {
  before(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    resetBackendData();
    deleteDownloadsFolder();
  });
  beforeEach(() => {
    visitLoginPage();
  });

  it('should be possible to start a hot-restart-mode study as login: hres1', () => {
    loginTestTaker('hres1', '203', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.intercept(`${Cypress.env('urls').backend}/test/3/unit/UNIT.SAMPLE-101/response`).as('response-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      // todo: wenn nur response abgefangen wird, ist die Zeit zu kurz, die Checkbox ist nicht aktiv obwohl angeklickt.
      // Es müsste noch auf state abgefangen werden, dann ist die Zeit etwas länger und die Checkbox ist aktiv.
      // Der Status kommt dummerweise allerdings nicht immer.
      .wait(1000)
      .should('be.checked');
    cy.wait('@response-1');
    forwardTo('Aufgabe2');
    cy.intercept(`${Cypress.env('urls').backend}/test/3/unit/UNIT.SAMPLE-102/response`).as('response-2');
    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .click()
      // todo: wenn nur response abgefangen wird, ist die Zeit zu kurz, die Checkbox ist nicht aktiv obwohl angeklickt.
      // Es müsste noch auf state abgefangen werden, dann ist die Zeit etwas länger und die Checkbox ist aktiv.
      // Der Status kommt dummerweise allerdings nicht immer.
      .wait(1000)
      .should('be.checked');
    cy.wait('@response-2');
    logoutTestTaker('hot');
  });

  it('should not possible to continue the session from login: hres1, it must be start a new session', () => {
    loginTestTaker('hres1', '203', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.intercept(`${Cypress.env('urls').backend}/test/4/unit/UNIT.SAMPLE-101/response`).as('response-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      // todo: wenn nur response abgefangen wird, ist die Zeit zu kurz, die Checkbox ist nicht aktiv obwohl angeklickt.
      // Es müsste noch auf state abgefangen werden, dann ist die Zeit etwas länger und die Checkbox ist aktiv.
      // Der Status kommt dummerweise allerdings nicht immer.
      .wait(1000)
      .should('be.checked');
    cy.wait('@response-1');
    forwardTo('Aufgabe2');
    cy.intercept(`${Cypress.env('urls').backend}/test/4/unit/UNIT.SAMPLE-102/response`).as('response-2');
    getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
      .click()
      // todo: wenn nur response abgefangen wird, ist die Zeit zu kurz, die Checkbox ist nicht aktiv obwohl angeklickt.
      // Es müsste noch auf state abgefangen werden, dann ist die Zeit etwas länger und die Checkbox ist aktiv.
      // Der Status kommt dummerweise allerdings nicht immer.
      .wait(1000)
      .should('be.checked');
    cy.wait('@response-2');
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

  it('should be generated a different ID/Code for each hres-login', () => {
    convertResultsSeperatedArrays('responses')
      .then(LoginID => {
        idHres1 = LoginID[1][2];
        idHres2 = LoginID[3][2];
        expect(idHres1).to.not.equal(idHres2);
      });
  });

  it('should be saved recent replies from first login: hres1 in downloaded response file', () => {
    getResultFileRows('responses')
      .then(responses => {
        expect(responses[1]).to.be.match(/\bhres1\b/);
        expect(responses[1]).to.be.match(/\bUNIT.SAMPLE-101\b/);

        expect(responses[1]).to.be.match(/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/);
        expect(responses[2]).to.be.match(/\bhres1\b/);
        expect(responses[2]).to.be.match(/\bUNIT.SAMPLE-102\b/);
        expect(responses[2]).to.be.match((/\bid"":""radio2"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
      });
  });

  it('should be saved recent replies from second login: hres1 in downloaded response file', () => {
    getResultFileRows('responses')
      .then(responses => {
        expect(responses[3]).to.be.match(/\bhres1\b/);
        expect(responses[3]).to.be.match(/\bUNIT.SAMPLE-101\b/);
        expect(responses[3]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
        expect(responses[4]).to.be.match(/\bhres1\b/);
        expect(responses[4]).to.be.match(/\bUNIT.SAMPLE-102\b/);
        expect(responses[4]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
      });
  });
});
