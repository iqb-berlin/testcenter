describe('Test for the static database', () => {

  it('should test', () => {
      cy.intercept('*',(req) => {
          console.log('Request intercepted');
          req.headers['AuthToken'] = 'static:admin:super'
          req.headers['TestMode'] = true;
      }).as('headers')

      //cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/code-input');
      cy.visit({
        url: `${Cypress.env('TC_URL')}/#/r/admin-starter`,
        method: 'GET',
        headers: {
          TestMode: true,
          AuthToken: 'static:admin:super'
        }
      });


      cy.wait('@headers')
        .its('request.headers')
        .should('have.property', 'AuthToken', 'static:admin:super')

        cy.wait('@headers')
        .its('request.headers')
        .should('have.property', 'TestMode', true)

  })
})