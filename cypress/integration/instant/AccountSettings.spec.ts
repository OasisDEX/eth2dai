import { clear, create, hasStatus, ProxyStatus, settings } from '../../pages/Proxy';
import { Tab } from '../../pages/Tab';
import { WalletConnection } from '../../pages/WalletConnection';
import { cypressVisitWithWeb3, tid } from '../../utils';

describe('Account Settings', () => {
  context('without connected wallet', () => {
    beforeEach(() => {
      cypressVisitWithWeb3();
      Tab.instant();
    });

    it('should disable account settings', () => {
      cy.get(tid('account-settings')).should('be.disabled');
    });
  });

  context('with connected wallet', () => {
    beforeEach(() => {
      cypressVisitWithWeb3();
      WalletConnection.connect();
      WalletConnection.isConnected();
      Tab.instant();
    });

    it('should create new proxy', () => {
      settings().click();
      hasStatus(ProxyStatus.MISSING);
      create();
      hasStatus(ProxyStatus.ENABLED);
    });

    it('should have missing proxy if user deletes proxy manually', () => {
      settings().click();
      hasStatus(ProxyStatus.MISSING);
      create();
      hasStatus(ProxyStatus.ENABLED);
      clear();
      hasStatus(ProxyStatus.MISSING);
    });
  });
});
