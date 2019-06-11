import { Tab } from '../../pages/Tab';
import { Trade } from '../../pages/Trade';
import { TradeData } from '../../pages/TradeData';
import { TradeSettings } from '../../pages/TradeSettings';
import { WalletConnection } from '../../pages/WalletConnection';
import { cypressVisitWithWeb3 } from '../../utils';

const initiateTrade = () => {
  const trade = new Trade();
  trade.buy('DAI').amount('100');
  return trade;
};

describe('Trade Settings', () => {
  beforeEach(() => {
    cypressVisitWithWeb3();
    WalletConnection.connect();
    Tab.instant();
  });

  it('should be disabled', () => {
    TradeSettings.button().should('be.disabled');
  });

  it('should be enabled when trade details are calculated', () => {
    initiateTrade();
    TradeSettings.button().should('not.be.disabled');
  });

  context('Trade Details', () => {
    it('should be displayed in trade settings', () => {
      initiateTrade();

      TradeSettings.button().click();

      TradeData.expectPriceImpact('0.00');
      TradeData.expectSlippageLimit('5.00');
      TradeData.expectPriceOf('280.00');
    });

    it('should reflect changed slippage limit', () => {
      initiateTrade();

      TradeSettings.button().click();

      TradeData.expectSlippageLimit('5.00');

      TradeSettings.slippageLimit('3');

      TradeData.expectSlippageLimit('3.00');
    });

    it('should keep changed value when returned to the new trade view', () => {
      initiateTrade();

      TradeSettings.button().click();

      TradeSettings.slippageLimit('3');

      TradeSettings.back();

      TradeData.expectSlippageLimit('3.00');
    });
  });
});
