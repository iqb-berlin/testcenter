import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

describe('check parameter: unit-time-left-warnings', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('1 second before end of time', () => {
    loginTestTaker('bklConfigDefault', '123', mode);
    // snackbar will be shown 1 second before the time is expired
    // because the testlet have only 1 second, the message will be displayed directly
    cy.get('.snackbar-timerWarning');
  });
});






