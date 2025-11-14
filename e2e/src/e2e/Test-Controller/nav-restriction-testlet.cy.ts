/* How its work: https://iqb-berlin.github.io/tba-info/intro/install/e2e.html section: Booklet-Config: */

import {
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check DenyNavigationOnIncomplete: response & presentation', { testIsolation: true }, () => {

  describe('response & presentation = OFF', { testIsolation: true }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      resetBackendData();
      cy.clearLocalStorage();
      cy.clearCookies();
      probeBackendApi();
    });

    beforeEach(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker('NavRestrTslt1', '123', 'test-hot');
    });

    it('presentation/response-complete: forward in unit-menu', () => {
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
    });

    it('presentation/response-complete: logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabenabschnitt verlassen?')
        .should(`exist`);
    });

   it('presentation/response-complete: forward/backward', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
   });
  });

  describe('response & presentation = ON ', { testIsolation: true }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      resetBackendData();
      cy.clearLocalStorage();
      cy.clearCookies();
      probeBackendApi();
    });

    beforeEach(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker('NavRestrTslt2', '123', 'test-hot');
    });

    it('presentation-complete: forward in unit-menu', () => {
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .closest('[role="dialog"]')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });

    it('presentation-complete: logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .closest('[role="dialog"]')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });

    it('presentation-complete: forward/backward', () => {
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('abgespielt')
        .closest('[role="dialog"]')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation-complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
    });

    it('responses-complete: forward/backward', () => {
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('bearbeitet')
        .closest('[role="dialog"]')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
    });
  });

  describe('response & presentation = ALWAYS ', { testIsolation: true }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      resetBackendData();
      cy.clearLocalStorage();
      cy.clearCookies();
      probeBackendApi();
    });

    beforeEach(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker('NavRestrTslt3', '123', 'test-hot');
    });

    it('presentation-complete: forward/backward in unit-menu', () => {
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .closest('[role="dialog"]')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation-complete
      cy.wait(2000);
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe1"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .closest('[role="dialog"]')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
    });

    it('presentation-complete: logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .closest('[role="dialog"]')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });

    it('presentation-complete: forward/backward', () => {
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation-complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('abgespielt')
        .closest('[role="dialog"]')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation-complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });

    it('responses-complete: forward/backward', () => {
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('bearbeitet')
        .closest('[role="dialog"]')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });
  });
});

