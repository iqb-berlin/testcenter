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

   it('presentation_complete: forward', () => {
      cy.get('[data-cy="unit-navigation-forward"]');
      cy.get('[data-cy="dialog-content"]')
        .should('not.exist');
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

    it('presentation_complete: backward', () => {
      cy.get('[data-cy="unit-navigation-forward"]');
      cy.get('[data-cy="unit-navigation-backward"]');
      cy.get('[data-cy="dialog-content"]')
        .should('not.exist');
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

    it('responses_complete: forward', () => {
      cy.get('[data-cy="unit-navigation-forward"]');
      cy.get('[data-cy="dialog-content"]')
        .should('not.exist');
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

    it('responses_complete: backward', () => {
      cy.get('[data-cy="unit-navigation-forward"]');
      cy.get('[data-cy="unit-navigation-backward"]');
      cy.get('[data-cy="dialog-content"]')
        .should('not.exist');
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="dialog-confirm"]')
        .click();
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

    it('presentation_complete: forward', () => {
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('abgespielt');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-confirm"]')
        .should('not.exist');
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
    });

    it('presentation_complete: backward', () => {
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-confirm"]')
        .should('not.exist');
    });

    it('responses_complete: forward', () => {
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('bearbeitet');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-confirm"]')
        .should('not.exist');
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
    });

    it('responses_complete: backward', () => {
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-confirm"]')
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

    it('presentation_complete: forward', () => {
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('abgespielt');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-confirm"]')
        .should('not.exist');
    });

    it('presentation_complete: backward', () => {
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
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('abgespielt');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-confirm"]')
        .should('not.exist');
    });

    it('responses_complete: forward', () => {
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('bearbeitet');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-confirm"]')
        .should('not.exist');
    });

    it('responses_complete: backward', () => {
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
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation complete
      cy.wait(2000);
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('bearbeitet');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-confirm"]')
        .should('not.exist');
    });
  });
});

