import {
  cleanUp,
  giveTestId,
  loginMonitor,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage,
  sendMonitorCommand
} from '../utils';

describe('Check testtaker behavior', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    resetBackendData();
    probeBackendApi();
    visitLoginPage();
    loginMonitor('GM-1', '123');
  });

  it('testtaker login', () => {
    visitLoginPage();
    loginTestTaker('testtaker-a', '123');
    giveTestId();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });

  it('pause', () => {
    const testId = Cypress.env('savedTestId');
    sendMonitorCommand({
      method: 'PUT',
      url: `${Cypress.env('urls').backend}/monitor/command`,
      expectedStatus: 201,
      keyword: 'pause',
      args: [],
      testIds: [testId]
    })
    cy.contains('Der Test wurde kurz angehalten.');
  });

  it('resume', () => {
    const testId = Cypress.env('savedTestId');
    sendMonitorCommand({
      method: 'PUT',
      url: `${Cypress.env('urls').backend}/monitor/command`,
      expectedStatus: 201,
      keyword: 'resume',
      args: [],
      testIds: [testId]
    })
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });

  it('go to', () => {
    const testId = Cypress.env('savedTestId');
    sendMonitorCommand({
      method: 'PUT',
      url: `${Cypress.env('urls').backend}/monitor/command`,
      expectedStatus: 201,
      keyword: 'goto',
      args: ["id","CY-Unit.Sample-102",""],
      testIds: [testId]
    })
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
  });

  it('terminate', () => {
    const testId = Cypress.env('savedTestId');
    sendMonitorCommand({
      method: 'PUT',
      url: `${Cypress.env('urls').backend}/monitor/command`,
      expectedStatus: 201,
      keyword: 'terminate',
      args: ["lock"],
      testIds: [testId]
    })
    cy.get('[data-cy="booklet-CY-BKLT_GM-1"]')
      .contains('gesperrt');
  });

  it('unlock', () => {
    const testId = Cypress.env('savedTestId');
    sendMonitorCommand({
      method: 'POST',
      url: `${Cypress.env('urls').backend}/monitor/group/filter-profiles/tests/unlock`,
      expectedStatus: 200,
      keyword: '',
      args: [],
      testIds: [testId]
    });
    cy.get('[data-cy="logout"]')
      .click();
    cy.get('[formcontrolname="name"]')
      .should(`be.visible`);
    visitLoginPage();
    loginTestTaker('testtaker-a', '123');
  });
});