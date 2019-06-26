import { tid } from '../utils/index';
import { Tab } from './Tab';

const timeout = 5000;

class Wallet {

  public web = () => {
    cy.get(tid('web-wallet')).click();
    return this;
  }

  public acceptToS = () => {
    cy.get(tid('accept-tos')).check({ force: true });
    return this;
  }

  public connect = () => {
    cy.get(tid('connect-wallet')).click();
  }
}

export class WalletConnection {

  public static connect() {
    WalletConnection.open().web().acceptToS().connect();
  }

  public static open() {
    cy.get(tid('new-connection'), { timeout }).click();
    return new Wallet();
  }

  public static status() {
    cy.get(tid('wallet-status'), { timeout }).click();
  }

  public static headingIs(text: string | RegExp) {
    cy.get(tid('wallet-connection-panel', tid('heading'))).contains(text);
  }

  public static close() {
    Tab.market();
  }

  public static isConnectButtonEnabled(isEnabled: boolean) {
    isEnabled
      ? cy.get(tid('connect-wallet'), { timeout }).should('not.be.disabled')
      : cy.get(tid('connect-wallet'), { timeout }).should('be.disabled');
  }

  public static hasAcceptedToS(isChecked: boolean) {
    isChecked
      ? cy.get(tid('accept-tos'), { timeout }).should('be.checked')
      : cy.get(tid('accept-tos'), { timeout }).should('not.be.checked');
  }

  public static isWebWalletSelected(isSelected: boolean) {
    isSelected
      ? cy.get(tid('web-wallet')).should('have.class', 'WalletConnection_selected')
      : cy.get(tid('web-wallet')).should('not.have.class', 'WalletConnection_selected');
  }

  public static isConnected() {
    cy.get(tid('status', tid('account')), { timeout }).contains(/0x79d7.../);
  }
}
