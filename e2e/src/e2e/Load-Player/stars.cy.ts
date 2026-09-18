import {
  cleanUp,
  clickCardButton,
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  logout,
  probeBackendApi,
  resetBackendTestData,
  twoStepLogin,
  visitLoginPage
} from '../utils';

// TODO stars-player tests für Pipeline noch deaktiviert. Es ist noch nicht final geklärt was alles getestet werden soll.
/*
Was macht der Test aktuell?
Prüfung Player lädt korrekt. Durchlauf eines Booklets mit den verschiedenen Test-Modi mit Festlegung Anzahl der Units.
*/

describe.skip('run a booklet', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    resetBackendTestData();
    probeBackendApi();
  });

  const TOTAL_UNITS = 28;

  const units = Array.from({ length: TOTAL_UNITS }, (_, i) => {
    const unitNum = i + 1;
    return {
      id: `unit-${unitNum}`,
      title: `Unit-${unitNum}`,
      button: `button-${i % 4}`,
      hasContinue: unitNum !== TOTAL_UNITS
    };
  });

  describe('Mode: review', { testIsolation: false }, () => {
    before(() => {
      visitLoginPage();
      disableSimplePlayersInternalDebounce();
      twoStepLogin('stars-1', '123');
      cy.url().should('contain', `${Cypress.config().baseUrl}/#/r/starter`);
      clickCardButton('booklet-CY-BKLT_STARS-1');
    });

    after(() => {
      cy.get('[data-cy="logo"]')
        .click();
      logout();
    });

   units.forEach(({ id, title, button, hasContinue = true }) => {
      it(id, () => {
        cy.get('[data-cy="unit-title"]')
          .contains(title);
        cy.get('[data-cy="send-comments"]')
          .click();
        cy.get('[data-cy="comment-diag-reviewer"]')
          .type('Mustermann');
        cy.get('[data-cy="comment-diag-currentBklt"]')
          .find('input[type="radio"]')
          .click({ force: true });
        cy.get('[data-cy="comment-diag-currentUnit"]')
          .find('input[type="radio"]')
          .click({ force: true });
        cy.get('[data-cy="comment-diag-comment"]')
          .type('Kommentar' + id);
        cy.get('[data-cy="comment-diag-priority1"]')
          .click();
        cy.get('[data-cy="comment-diag-submit"]')
          .click({ force: true });
        getFromIframe('iframe.unitHost').within(() => {
          cy.get(`[data-cy="${button}"]`).click();
          if (hasContinue) {
            cy.get('[data-cy="continue-button"]').click();
          }
        });
      });
    });
  });

  describe('Mode: demo', { testIsolation: false }, () => {
    before(() => {
      visitLoginPage();
      disableSimplePlayersInternalDebounce();
      twoStepLogin('stars-2', '123');
    });

    after(() => {
      cy.get('[data-cy="logo"]')
        .click();
      logout();
    });

    units.forEach(({ id, title, button, hasContinue = true }) => {
      it(id, () => {
        cy.get('[data-cy="unit-title"]').contains(title);

        getFromIframe('iframe.unitHost').within(() => {
          cy.get(`[data-cy="${button}"]`).click();
          if (hasContinue) {
            cy.get('[data-cy="continue-button"]').click();
          }
        });
      });
    });
  });

  describe('Mode: run-hot-return', { testIsolation: false }, () => {
      before(() => {
        visitLoginPage();
        disableSimplePlayersInternalDebounce();
        twoStepLogin('stars-3', '123');
      });

      units.forEach(({ id, title, button, hasContinue = true }) => {
        it(id, () => {
          cy.get('[data-cy="unit-title"]').contains(title);

          getFromIframe('iframe.unitHost').within(() => {
            cy.get(`[data-cy="${button}"]`).click();
            if (hasContinue) {
              cy.get('[data-cy="continue-button"]').click();
            }
          });
        });
      });
  });
});



