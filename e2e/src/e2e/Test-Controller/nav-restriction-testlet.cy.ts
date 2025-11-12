/* How its work: https://iqb-berlin.github.io/tba-info/intro/install/e2e.html section: Booklet-Config: */

import {
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

describe('check DenyNavigationOnIncomplete: response & presentation = OFF', { testIsolation: false }, () => {
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
    loginTestTaker('NavRestrVal1', '123', mode);
  });

  afterEach(() => {
    cy.window().then((win) => {
      win.location.href = 'about:blank'
    });
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

describe('check DenyNavigationOnIncomplete: response & presentation = ON ', { testIsolation: false }, () => {
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
    loginTestTaker('NavRestrVal2', '123', mode);
  });

  afterEach(() => {
    cy.window().then((win) => {
      win.location.href = 'about:blank'
    });
  });

  it('presentation_complete: forward', () => {
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
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
    cy.wait(1000);
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    cy.get('[data-cy="page-navigation-backward"]')
      .click();
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
  });

  it('responses_complete: forward', () => {
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
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
    cy.wait(1000);
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
    cy.wait(1000);
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

describe('check DenyNavigationOnIncomplete: response & presentation = ALWAYS ', { testIsolation: false }, () => {
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
    loginTestTaker('NavRestrVal3', '123', mode);
  });

  afterEach(() => {
    cy.window().then((win) => {
      win.location.href = 'about:blank'
    });
  });

  it('presentation_complete: forward', () => {
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('abgespielt');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
  });

  it('presentation_complete: backward', () => {
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-content"]')
      .contains('abgespielt');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
  });

  it('responses_complete: forward', () => {
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
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
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
  });

  it('responses_complete: backward', () => {
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(1000);
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation complete
    cy.wait(1000);
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
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
  });

});
