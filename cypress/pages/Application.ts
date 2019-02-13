import { tid } from '../utils/index';

export class ApplicationState {

  public static acceptToS() {
    cy.get(tid('accept-tos'), { timeout: 5000 }).check({ force: true });
    cy.get(tid('continue-with-app')).click();
    cy.get(tid('continue-with-new-contract')).click();
  }

}
