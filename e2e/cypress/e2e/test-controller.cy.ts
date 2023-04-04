// TODO better selectors
// TODO get rid of sleeps

import { login, useTestDB } from './utils';
import 'cypress-iframe';
import inViewport from '../support/inViewport';

xdescribe('Test-Controller', () => {
  before(() => { chai.use(inViewport); });
  beforeEach(useTestDB);
  beforeEach(() => login('test', 'user123'));

  it('Should start a sample booklet and click through the unit tabs', () => {
    cy.contains('Weiter')
      .click();
    cy.get('[formControlName="code"]')
      .should('exist')
      .type('xxx')
      .get('[data-cy="continue"]')
      .click();
    cy.get('[data-cy="booklet-BOOKLET.SAMPLE-1"]')
      .click();
    cy.url().should('include', '/u/1');
    cy.get('[data-cy="2nd Sample Unit"]')
      .click();
    cy.reload();
    cy.url().should('include', '/u/2');
    cy.get('[data-cy="Sample Unit Again"]')
      .click();
    cy.url().should('include', '/u/3');
    cy.get('[data-cy="Sample Unit"]')
      .click();
    cy.url().should('include', '/u/1');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="endTest-1"]')
      .click();
    cy.get('[data-cy="logout"]')
      .click()
  });

  it('Should navigate inside the iframe using the arrow buttons', () => {
    cy.contains('Weiter')
      .click();
    cy.get('[formControlName="code"]')
      .should('exist')
      .type('xxx')
      .get('[data-cy="continue"]')
      .click();
    cy.get('[data-cy="booklet-BOOKLET.SAMPLE-3"]')
      .click();
    cy.url().should('include', '/u/1');
    cy.frameLoaded('.unitHost');
    cy.iframe('.unitHost').find('#next-unit')
      .click()
    cy.wait(100)
    cy.url().should('include', '/u/2');
    cy.iframe('.unitHost').find('#last-unit')
      .click()
    cy.wait(100)
    cy.url().should('include', '/u/3');
    cy.iframe('.unitHost').find('#prev-unit')
      .click()
    cy.wait(100)
    cy.url().should('include', '/u/2');
    cy.iframe('.unitHost').find('#first-unit')
      .click()
    cy.wait(100)
    cy.url().should('include', '/u/1');
    cy.iframe('.unitHost').find('#end-unit')
      .click()
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="logout"]')
      .click()
  });

  it('Should navigate inside a unit using the navigation buttons', () => {
    cy.contains('Weiter')
      .click();
    cy.get('[formControlName="code"]')
      .should('exist')
      .type('xxx')
      .get('[data-cy="continue"]')
      .click();
    cy.get('[data-cy="booklet-BOOKLET.SAMPLE-1"]')
      .click();
    cy.frameLoaded('.unitHost');
    cy.get('[data-cy="page-navigation-0"]')
      .click()
    cy.iframe('.unitHost')
      .find('[data-cy="legend-about"]')
      .should('be.inViewport');
    cy.get('[data-cy="page-navigation-1"]')
      .click();
    cy.iframe('.unitHost')
      .find('[data-cy="legend-longContent"]')
      .scrollIntoView()
      .should('be.inViewport');
    cy.get('[data-cy="page-navigation-2"]')
      .click()
    cy.iframe('.unitHost')
      .find('[data-cy="legend-extensibility"]')
      .scrollIntoView()
      .should('be.inViewport');
    cy.get('[data-cy="page-navigation-3"]')
      .click()
    cy.iframe('.unitHost')
      .find('[data-cy="legend-logging"]')
      .scrollIntoView()
      .should('be.inViewport');
    cy.iframe('.unitHost').find('#end-unit')
      .click()
      .wait(500);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
    cy.get('[data-cy="logout"]')
    .click()
  });

  it('Should unlock a locked unit', () => {
    cy.contains('Weiter')
      .click();
    cy.get('[formControlName="code"]')
      .should('exist')
      .type('xxx')
      .get('[data-cy="continue"]')
      .click();
    cy.get('[data-cy="booklet-BOOKLET.SAMPLE-1"]')
      .click();
    cy.get('[data-cy="2nd Sample Unit"]')
      .click();
    cy.contains('Aufgabenblock ist noch gesperrt')
      .should('exist');
    cy.get('[data-cy="unlockUnit"]')
      .type('SAMPLE');
    cy.contains('OK')
      .click();
    cy.frameLoaded('.unitHost');
    cy.iframe('.unitHost')
      .contains('Sample Unit calling external File')
      .should('exist');
    cy.iframe('.unitHost')
      .find('#next-unit')
      .click();
    cy.get('button.mat-raised-button:nth-child(1) > span:nth-child(1)')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/1/u/3`);
    cy.get('[data-cy="2nd Sample Unit"]')
      .click();
    cy.contains('Aufgabenzeit ist abgelaufen')
      .should('exist');
    cy.get('[data-cy="Sample Unit"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/1/u/1`);
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="endTest-1"]')
      .click();
    cy.get('[data-cy="logout"]')
      .click()
  });
});
