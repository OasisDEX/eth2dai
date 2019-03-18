import { tid, timeout } from '../utils';
import { Summary } from './Summary';

export class Finalization {
  public currentTx: string = '';

  public shouldCreateProxy = () => {
    this.currentTx = 'proxyTx';

    cy.get(tid('create-proxy'))
      .as(this.currentTx)
      .contains('Create Account');

    return this;
  }

  public shouldNotCreateProxy = () => {
    cy.get(tid('create-proxy'))
      .should('not.exist');
    return this;
  }

  public shouldSetAllowanceFor = (token: string) => {
    this.currentTx = 'allowanceTx';

    cy.get(tid('set-token-allowance'))
      .as(this.currentTx)
      .find(tid('label'))
      .contains(`Unlock ${token.toUpperCase()}`);

    return this;
  }

  public shouldNotSetAllowance = () => {
    cy.get(tid('set-token-allowance'))
      .should('not.exist');

    return this;
  }

  public shouldCommitATrade = (pay: string, from: string, receive: string, to: string) => {

    cy.get(tid('pay-token', tid('amount'))).contains(`${pay}`);
    cy.get(tid('pay-token', tid('currency'))).contains(`${from}`);
    cy.get(tid('buy-token', tid('amount'))).contains(`${receive}`);
    cy.get(tid('buy-token', tid('currency'))).contains(`${to}`);

    return new Summary();
  }

  public expectSuccess = () => {
    cy.get(`@${this.currentTx}`).get(tid('status')).contains('Confirmed');
  }
}
