import { Tab } from '../../pages/Tab';
import { Trade } from '../../pages/Trade';
import { TradeData } from '../../pages/TradeData';
import { TradeSettings } from '../../pages/TradeSettings';
import { WalletConnection } from '../../pages/WalletConnection';
import { cypressVisitWithWeb3, tid, timeout } from '../../utils';

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

    it('should reset the slippage limit if new token is selected for deposit token', () => {
      initiateTrade();

      TradeSettings.button().click();

      TradeSettings.slippageLimit('3');

      TradeSettings.back();

      TradeData.expectSlippageLimit('3.00');

      new Trade().sell('WETH').amount('1');

      TradeData.expectSlippageLimit('5.00');
    });

    it('should reset the slippage limit if new token is selected for receive token', () => {
      initiateTrade();

      TradeSettings.button().click();

      TradeSettings.slippageLimit('3');

      TradeSettings.back();

      TradeData.expectSlippageLimit('3.00');

      new Trade().buy('WETH').amount('1');

      TradeData.expectSlippageLimit('5.00');
    });

    it('should reset the slippage limit if tokens in the pair are just swapped', () => {
      initiateTrade();

      TradeSettings.button().click();

      TradeSettings.slippageLimit('3');

      TradeSettings.back();

      TradeData.expectSlippageLimit('3.00');

      Trade.swapTokens();

      cy.get(tid('buying-token', tid('amount')), timeout(2000)).type('1');

      TradeData.expectSlippageLimit('5.00');
    });
  });
});
