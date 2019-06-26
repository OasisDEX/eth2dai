import { WalletConnection } from '../pages/WalletConnection';
import { cypressVisitWithoutProvider, cypressVisitWithWeb3, tid } from '../utils';

const goBack = () => {
  cy.get(tid('go-back'), { timeout: 5000 }).click();
};

describe('Wallet', () => {

  context('with no provider', () => {

    beforeEach(() => {
      cypressVisitWithoutProvider();
    });

    it('should display suggested clients if web wallet is clicked', () => {
      const wallet = WalletConnection.open();

      WalletConnection.headingIs('Connect Wallet');

      wallet.web();

      WalletConnection.headingIs('Get a Wallet');

      cy.get(tid('suggested-clients')).find('li').should('have.length', 4);
    });

    it('should display connect wallet view if go back is clicked in suggested clients view', () => {
      const wallet = WalletConnection.open();
      wallet.web();

      goBack();

      WalletConnection.headingIs('Connect Wallet');
    });

    it('should clear active checkbox after coming back from suggested clients view', () => {
      const wallet = WalletConnection.open();
      wallet.acceptToS();

      WalletConnection.hasAcceptedToS(true);

      wallet.web();

      goBack();

      WalletConnection.hasAcceptedToS(false);
    });

    it('should clear active checkbox if wallet connection panel is reopened', () => {
      WalletConnection.open().acceptToS();

      WalletConnection.hasAcceptedToS(true);

      WalletConnection.close();

      cy.wait(1000);

      WalletConnection.open();

      WalletConnection.hasAcceptedToS(false);
    });

    // tslint:disable-next-line:max-line-length
    it('should start with connect wallet view even when last visited view was something else', () => {
      WalletConnection.open().web();

      WalletConnection.headingIs('Get a Wallet');

      WalletConnection.close();

      cy.wait(1000);

      WalletConnection.open();

      WalletConnection.headingIs('Connect Wallet');
    });

    it('should have connect button always disabled', () => {
      const wallet = WalletConnection.open().acceptToS();

      WalletConnection.isConnectButtonEnabled(false);

      wallet.web();

      goBack();

      WalletConnection.isConnectButtonEnabled(false);

      WalletConnection.close();

      WalletConnection.open();

      WalletConnection.isConnectButtonEnabled(false);
    });
  });

  context('with provider but no connection', () => {
    beforeEach(() => {
      cypressVisitWithWeb3();
    });

    it('should select web wallet and connect', () => {
      WalletConnection.connect();

      WalletConnection.isConnected();
    });

    // tslint:disable-next-line:max-line-length
    it('should clear selected wallet and accepted tos if dropdown is closed and wallet not connected', () => {
      WalletConnection.open().web().acceptToS();

      WalletConnection.close();

      // tslint:disable-next-line:max-line-length
      // because of the animation the state is not cleared. We have to wait for the component to completely unmount
      cy.wait(1000);

      WalletConnection.open();

      WalletConnection.hasAcceptedToS(false);
      WalletConnection.isConnectButtonEnabled(false);
      WalletConnection.isWebWalletSelected(false);
    });

    it('should  not allow to connect if only tos is selected', () => {
      WalletConnection.open().acceptToS();

      WalletConnection.isConnectButtonEnabled(false);
    });

    it('should not allow to connect if only wallet is selected', () => {
      WalletConnection.open().web();

      WalletConnection.isConnectButtonEnabled(false);
    });
  });

  context('connect', () => {
    beforeEach(() => {
      cypressVisitWithWeb3();
    });

    it('should display which provider is connected', () => {
      WalletConnection.connect();

      cy.wait(1000);

      WalletConnection.status();

      WalletConnection.headingIs('Web Wallet Connected');
    });

    it('should ask to connect the wallet if ToS acceptance is removed', () => {
      WalletConnection.connect();

      cy.wait(1000);

      cy.clearLocalStorage();

      WalletConnection.open();
      WalletConnection.headingIs('Connect Wallet');
      WalletConnection.hasAcceptedToS(false);
      WalletConnection.isWebWalletSelected(false);
    });
  });
});
