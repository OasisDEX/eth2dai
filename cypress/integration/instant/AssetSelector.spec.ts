import { Tab } from '../../pages/Tab';
import { Trade } from '../../pages/Trade';
import { WalletConnection } from '../../pages/WalletConnection';
import { cypressVisitWithWeb3, tid, timeout } from '../../utils';

describe('Selecting an asset', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    WalletConnection.connect();
    Tab.instant();
  });

  context('for pay token', () => {
    const defaultTokens = () => {
      const trade = new Trade();
      trade.sell('ETH');
      trade.buy('DAI');

      trade.expectPayToken('ETH');
      trade.expectReceiveToken('DAI');
    };

    beforeEach(() => {
      defaultTokens();
    });

    it('should replace only the deposit token', () => {
      const payIn = 'WETH';
      const receiveIn = 'DAI';

      const trade = new Trade();
      trade.sell(payIn);

      trade.expectPayToken(payIn);
      trade.expectReceiveToken(receiveIn);
    });

    it('should swap pay and receive token when receive token is the same as pay token', () => {
      const payIn = 'DAI';
      const receiveIn = 'ETH';

      const trade = new Trade();
      trade.sell(payIn);

      trade.expectPayToken(payIn);
      trade.expectReceiveToken(receiveIn);
    });

    // tslint:disable-next-line:max-line-length
    it('should swap pay and receive token when receive token (WETH) is the same as pay token (ETH) ', () => {
      const payIn = 'DAI';
      const receiveIn = 'WETH';

      const trade = new Trade();
      trade.buy(receiveIn);

      trade.expectPayToken(payIn);
      trade.expectReceiveToken(receiveIn);
    });

    // tslint:disable-next-line:max-line-length
    it('should not be able to select receive token that do not form a market with the deposit one', () => {
      const token = 'BAT';

      cy.get(tid('buying-token', tid('balance')), timeout(2000))
        .click();

      cy.get(tid(token.toLowerCase(), tid('asset-button'))).should('be.disabled');
    });
  });

  context('for receive token', () => {
    const defaultTokens = () => {
      const trade = new Trade();
      trade.sell('DAI');
      trade.buy('ETH');

      trade.expectPayToken('DAI');
      trade.expectReceiveToken('ETH');
    };

    beforeEach(() => {
      defaultTokens();
    });

    it('should replace only the receive token', () => {
      const payIn = 'DAI';
      const receiveIn = 'WETH';

      const trade = new Trade();
      trade.buy(receiveIn);

      trade.expectPayToken(payIn);
      trade.expectReceiveToken(receiveIn);
    });

    it('should swap pay and receive token when receive token is the same as pay token', () => {
      const payIn = 'ETH';
      const receiveIn = 'DAI';

      const trade = new Trade();
      trade.buy(receiveIn);

      trade.expectPayToken(payIn);
      trade.expectReceiveToken(receiveIn);
    });

    // tslint:disable-next-line:max-line-length
    it('should swap pay and receive token when receive token (ETH) is the same as pay token (WETH) ', () => {
      const payIn = 'WETH';
      const receiveIn = 'DAI';

      const trade = new Trade();
      trade.sell(payIn);

      trade.expectPayToken(payIn);
      trade.expectReceiveToken(receiveIn);
    });

    // tslint:disable-next-line:max-line-length
    it('should not be able to select deposit token that do not form a market with the receive one ', () => {
      const token = 'BAT';

      const trade = new Trade();
      trade.buy('DGD');

      cy.get(tid('selling-token', tid('balance')), timeout(2000))
        .click();

      cy.get(tid(token.toLowerCase(), tid('asset-button'))).should('be.disabled');
    });
  });
});
