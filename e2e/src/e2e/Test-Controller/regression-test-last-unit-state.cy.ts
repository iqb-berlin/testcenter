import {
  cleanUp,
  forwardTo,
  getFromIframe, insertCredentials,
  modifyPlayer,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('Test Controller', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    modifyPlayer([
      {
        replace: 'const overridePlayerSettings = (location.search);',
        with: 'const overridePlayerSettings = "?debounceStateMessages=0&debounceKeyboardEvents=0"'
      },
      {
        replace: 'window.vsp = { PlayerUI, Message, Pages, Log };',
        with:
          'window.vsp = { PlayerUI, Message, Pages, Log };' +
          'window.addEventListener(\'unload\', () => { Message.send._send(Message.send._createStateMsg(true)); });'
      }
    ]);
  });

  it('should not confuse response data if a last package was sent with window:unload', () => {
    visitLoginPage();
    insertCredentials('test', 'user123');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[formcontrolname="code"]')
      .type('xxx');
    cy.get('[data-cy="continue"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.get('[data-cy="booklet-BOOKLET.SAMPLE-2"]')
      .click();
    getFromIframe('iframe.unitHost')
      .find('#var1')
      .type('unit 1 - input');
    cy.wait(1000);
    forwardTo('Ⓐ Beginner Unit');
    getFromIframe('iframe.unitHost')
      .find('#var1')
      .type('unit 2 - input');
    cy.wait(1000);
    getFromIframe('iframe.unitHost')
      .find('#end-unit')
      .click();
    // response outputs are ordered by groupname, loginname, code, unitname, originalUnitId (see AdminDAO)
    getResponses()
      .then(rows => {
        if (!Array.isArray(rows)) throw new Error('wrong response');
        rows.forEach(row => cy.log(`ROW ${JSON.stringify(row.responses)}`));
        expect(rows.length).to.equal(3);
        expect(rows[1].unitname).to.equal('beginner-unit');
        expect(rows[1].responses[0].content[0].id).to.equal('var1');
        expect(rows[1].responses[0].content[0].value).to.equal('unit 2 - input');
        expect(rows[2].unitname).to.equal('decision-unit');
        expect(rows[2].responses[0].content[0].id).to.equal('var1');
        expect(rows[2].responses[0].content[0].value).to.equal('unit 1 - input');
      });
  });
});

const getResponses =
  (wsId: number = 1, groups: string[] = ['sample_group']) => cy.request({
    url: `${Cypress.config().baseUrl}/api/workspace/${wsId}/report/response?dataIds=${groups.join('&')}`,
    method: 'GET',
    headers: { authToken: 'static:admin:super', testMode: 'integration' }
  })
    .then(responses => {
      expect(responses.status).to.equal(200);
      if (!Array.isArray(responses.body)) throw new Error('invalid response');
      responses.body.forEach(row => {
        row.laststate = JSON.parse(row.laststate);
        row.responses.forEach(chunk => {
          chunk.content = JSON.parse(chunk.content);
        });
      });
      return responses.body;
    });
