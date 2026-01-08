import {
  cleanUp,
  giveTestId,
  loginMonitor,
  loginTestTaker,
  logoutTestTakerHot,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('Check monitor functions', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    resetBackendData();
    probeBackendApi();
    visitLoginPage();
    // es muss ein testtaker in der DB sein für diesen Test
    loginTestTaker('testtaker-a', '123');
    giveTestId();
    logoutTestTakerHot();
  });

  it('group-monitor login', () => {
    visitLoginPage();
    loginMonitor('GM-1', '123');
    cy.get('[data-cy="GM-filter-profiles-0"]')
      .click();
    cy.contains('testtaker-a');
  });

  it('switch: control all', () => {
    cy.get('[data-cy="GM_control_all_tests"]')
      .click();
    cy.get('[data-cy="GM-tt-checkbox"]');
    cy.get('[data-cy="GM_control_all_tests"]')
      .click();
  });

  it('button: pause', () => {
    const testId = Cypress.env('savedTestId');
    cy.intercept('PUT', `${Cypress.env('urls').backend}/monitor/command`, (req) => {
      req.continue((res) => {
      expect(req.body.testIds).to.include(Number(testId));
      expect(req.body.keyword).to.equal('pause');
      });
      }).as('PauseCommand');
      cy.get('[data-cy="GM_pause_button"]')
        .click();
      cy.wait('@PauseCommand');
  });

  it('button: resume', () => {
    const testId = Cypress.env('savedTestId');
    cy.intercept('PUT', `${Cypress.env('urls').backend}/monitor/command`, (req) => {
      req.continue((res) => {
        expect(req.body.testIds).to.include(Number(testId));
        expect(req.body.keyword).to.equal('resume');
      });
    }).as('ResumeCommand');
    cy.get('[data-cy="GM_forward_button"]')
      .click();
    cy.wait('@ResumeCommand');
  });

  it('button: go to', () => {
    const testId = Cypress.env('savedTestId');
    cy.get('[data-cy="gm-testlet-select"]')
      .click({ force: true });
    cy.intercept('PUT', `${Cypress.env('urls').backend}/monitor/command`, (req) => {
      req.continue((res) => {
        expect(req.body.testIds).to.include(Number(testId));
        expect(req.body.arguments[1]).to.equal('CY-Unit.Sample-101');
        expect(req.body.keyword).to.equal('goto');
      });
    }).as('goToCommand');
    cy.get('[data-cy="GM_jump_button"]')
      .contains('Block 1')
      .click();
    cy.wait('@goToCommand');
  });

  it('button: test terminate', () => {
    cy.get('[data-cy="gm-testlet-select"]')
      .click({ force: true });
    cy.intercept('PUT', `${Cypress.env('urls').backend}/monitor/command`, (req) => {
      req.continue((res) => {
        expect(req.body.arguments[0]).to.equal('lock');
        expect(req.body.keyword).to.equal('terminate');
      });
    }).as('terminateCommand');
    cy.get('[data-cy="GM_end_button"]')
      .click();
    cy.contains('mat-dialog-container', 'Testdurchführung Beenden')
      .find('[data-cy="dialog-confirm"]')
      .click();
    cy.wait('@terminateCommand');
    cy.get('[data-cy="login-user"]')
      .should('be.visible');
  });

  it('button: unlock', () => {
    loginMonitor('GM-1', '123');
    cy.get('[data-cy="GM-filter-profiles-0"]')
      .click();
    const testId = Cypress.env('savedTestId');
    cy.intercept('POST', `${Cypress.env('urls').backend}/monitor/group/filter-profiles/tests/unlock`, (req) => {
      req.continue((res) => {
        expect(req.body.testIds).to.include(Number(testId));
      });
    }).as('unlockCommand');
    cy.get('[data-cy="GM_lock_button"]')
      .click();
    cy.wait('@unlockCommand');
  });
});