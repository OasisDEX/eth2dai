import { ApplicationState } from '../pages/Application';
import { Tab } from '../pages/Tab';
import { Trade } from '../pages/Trade';
import { cypressVisitWithWeb3 } from '../utils';

describe('Selecting an asset', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    ApplicationState.acceptToS();
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

    it('should swap pay and receive token when receive token (WETH) is the same as pay token (ETH) ', () => {
      const payIn = 'DAI';
      const receiveIn = 'WETH';

      const trade = new Trade();
      trade.buy(receiveIn);

      trade.expectPayToken(payIn);
      trade.expectReceiveToken(receiveIn);
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

    it('should swap pay and receive token when receive token (ETH) is the same as pay token (WETH) ', () => {
      const payIn = 'WETH';
      const receiveIn = 'DAI';

      const trade = new Trade();
      trade.sell(payIn);

      trade.expectPayToken(payIn);
      trade.expectReceiveToken(receiveIn);
    });
  });
});
