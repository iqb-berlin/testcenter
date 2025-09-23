/* How its work: https://iqb-berlin.github.io/tba-info/intro/install/e2e.html section: Booklet-Config: */

import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

describe('check correct loading player', { testIsolation: false }, () => {
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
    loginTestTaker('loadPlayer', '123', mode);
  });

  afterEach(() => {
    cy.window().then((win) => {
      win.location.href = 'about:blank'
    });
  });

  it('speedtest-player', () => {
    cy.get('iframe.unitHost')
      .its('0.contentDocument.body')
      .should('not.be.empty')
      .then(cy.wrap)
      .contains('richtig');
  });

});