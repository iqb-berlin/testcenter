/* How its work: https://iqb-berlin.github.io/tba-info/intro/install/e2e.html section: Booklet-Config: */

import {
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  logoutTestTakerBkltConfig,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

describe('check values 2', { testIsolation: false }, () => {
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
    loginTestTaker('bklConfigValue3', '123', mode);
  });

  afterEach(() => {
    logoutTestTakerBkltConfig('hot_BkltConfigValue1');
  });

  it('unit_navibuttons', () => {
    // value -2:  ARROWS_ONLY
    cy.get('[data-cy="unit-navigation-forward"]');
    cy.get('[data-cy="unit-navigation-backward"]')
      .should('not.exist');
  });

  it('unit_screenheader', () => {
    // value -2:  WITH_UNIT_TITLE
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabenblock');
  });


});
