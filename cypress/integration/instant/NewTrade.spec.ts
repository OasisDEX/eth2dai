import { Order } from '../../pages/Order';
import { Orderbook, OrderType } from '../../pages/Orderbook';
import { Tab } from '../../pages/Tab';
import { Trade } from '../../pages/Trade';
import { TradeData } from '../../pages/TradeData';
import { WalletConnection } from '../../pages/WalletConnection';
import { cypressVisitWithWeb3, multiply, tid, timeout } from '../../utils';
import { makeScreenshots } from '../../utils/makeScreenshots';

const waitForBalancesToLoad = () => {
  cy.wait(500);
  cy.get(tid('selling-token', tid('balance')), timeout()).contains(/8,999.../);
  cy.get(tid('buying-token', tid('balance')), timeout()).contains(/170.../);
};

describe('New trade', () => {

  context('with connected wallet', () => {
    beforeEach(() => {
      // this test suite randomly fails on react error
      // can't reproduce it in real life
      // i imagine it is a cypress bug ¯\_(ツ)_/¯
      cy.on('uncaught:exception', (_err) => {
        return false;
      });

      cypressVisitWithWeb3();
      WalletConnection.connect();
      Tab.instant();
      waitForBalancesToLoad();
    });

    it('should calculate how much the user will receive', () => {
      const trade = new Trade();
      trade.sell().amount('2');
      trade.expectToReceive('555.00');

      TradeData.expectPriceOf(/(277\.50)/);
      TradeData.expectSlippageLimit(/5\.00%/);
      TradeData.expectPriceImpact(/0\.89%/);

      cy.wait(500);
      makeScreenshots('instant-trade');
    });

    it('should calculate how much the user will pay', () => {
      const trade = new Trade();
      trade.buy().amount('320.00');
      trade.expectToPay('1.145');

      TradeData.expectPriceOf(/(279\.37)/);
      TradeData.expectSlippageLimit(/5\.00%/);
      TradeData.expectPriceImpact(/0\.22%/);
    });

    it('should remove how much the user will receive if the pay value is cleared', () => {
      const trade = new Trade();
      const sell = trade.sell();
      sell.amount('0.5');

      trade.expectToReceive('140.00');

      sell.clear();

      trade.expectToReceive('');
    });

    it('should remove how much the user will pay if the buy value is cleared', () => {
      const trade = new Trade();
      const buy = trade.buy();
      buy.amount('140');

      trade.expectToPay('0.500');

      buy.clear();

      trade.expectToPay('');
    });

    it('should swap tokens', () => {
      Trade.swapTokens();

      cy.get(tid('selling-token', tid('balance')), timeout()).contains(/170.../);
      cy.get(tid('buying-token', tid('balance')), timeout()).contains(/8,999.../);
    });

    it('should clear input values on swap', () => {
      const trade = new Trade();
      trade.sell('ETH').amount('280.00');
      trade.buy('DAI');

      Trade.swapTokens();

      cy.get(tid('selling-token', tid('balance')), timeout()).contains(/170.../);
      cy.get(tid('buying-token', tid('balance')), timeout()).contains(/8,999.../);

      cy.get(tid('selling-token', tid('amount')), timeout()).should('be.empty');
      cy.get(tid('buying-token', tid('amount')), timeout()).should('be.empty');
    });

    it('should keep values if we reselect same deposit token', () => {
      const sell = 'ETH';
      const willPay = '1';
      const willReceive = '280.00';
      const trade = new Trade();
      trade.sell(sell).amount(willPay);

      trade.expectToPay(willPay);
      trade.expectToReceive(willReceive);

      trade.sell('ETH');

      trade.expectToPay('1.000');
      trade.expectToReceive(willReceive);
    });

    it('should keep values if we reselect same receive token', () => {
      const sell = 'ETH';
      const willPay = '1';
      const willReceive = '280.00';
      const trade = new Trade();
      trade.sell(sell).amount(willPay);

      trade.expectToPay(willPay);
      trade.expectToReceive(willReceive);

      trade.buy('DAI');

      trade.expectToPay('1.000');
      trade.expectToReceive(willReceive);
    });

    it('should display error if balance is too low', () => {
      Trade.swapTokens();

      const trade = new Trade();
      trade.sell().amount('200');
      // Find a way to evaluate the error content returned from the mapping ( no hardcoded values )
      trade.resultsInError(`You don't have 200.00 DAI in your wallet`, 'bottom');
    });

    it('should highlight the price impact in the trade details', () => {
      Tab.market();

      const price = '50';
      const amount = '1';

      new Order()
        .buy()
        .limit()
        .amount(amount)
        .atPrice(price)
        .total(multiply(amount, price))
        .place();

      const orders = Orderbook.list(OrderType.BUY);
      orders.countIs(4);

      Tab.instant();

      const trade = new Trade();
      trade.sell('ETH')
        .amount('5');

      trade.expectPriceImpact(`19.28%`, true);

      cy.get(tid('notification-cross')).click();

      cy.wait(500);
      makeScreenshots('price-impact-highlight');
    });

    it('should display warning message if the price impact is higher than threshold', () => {
      Tab.market();

      const price = '50';
      const amount = '1';

      new Order()
        .buy()
        .limit()
        .amount(amount)
        .atPrice(price)
        .total(multiply(amount, price))
        .place();

      const orders = Orderbook.list(OrderType.BUY);
      orders.countIs(4);

      Tab.instant();

      const trade = new Trade();
      trade.sell('ETH')
        .amount('5');

      trade.expectPriceImpact(`19.28%`, true);

      const finalization = trade.execute();

      makeScreenshots('price-impact-warning');
      finalization.shouldHavePriceImpactWarning();
      finalization.acceptPriceImpact();
      finalization.shouldCreateProxy();
    });

    // tslint:disable-next-line:max-line-length
    it('should keep trade date and not continue with transaction if price impact warning is dismissed', () => {
      Tab.market();

      const price = '50';
      const amount = '1';

      new Order()
        .buy()
        .limit()
        .amount(amount)
        .atPrice(price)
        .total(multiply(amount, price))
        .place();

      const orders = Orderbook.list(OrderType.BUY);
      orders.countIs(4);

      Tab.instant();

      const trade = new Trade();
      trade.sell('ETH')
        .amount('5');

      trade.expectToReceive('1,130.00');
      trade.expectToPay('5');
      trade.expectPriceImpact('19.28%', true);

      const finalization = trade.execute();
      finalization.shouldHavePriceImpactWarning();
      finalization.dismissPriceImpact();

      trade.expectPriceImpact('19.28%', true);
      trade.expectToReceive('1,130.00');
      trade.expectToPay('5.000');
    });

    it('should clear receive input if 0 is provided to deposit input', () => {
      const trade = new Trade();
      trade.buy('DAI')
        .amount('2');

      trade.expectToReceive('2');
      trade.expectToPay('0.007');

      trade.sell('ETH')
        .type('{selectall}0');

      trade.expectToReceive('');
      trade.expectToPay('0');
    });

    it('should clear deposit input if 0 is provided to receive input', () => {
      const trade = new Trade();
      trade.sell('ETH')
        .amount('1');

      trade.expectToReceive('280.00');
      trade.expectToPay('1');

      trade.buy('DAI')
        .type('{selectall}0');

      trade.expectToReceive('0');
      trade.expectToPay('');
    });
  });

  context('with not connected wallet', () => {

    beforeEach(() => {
      cypressVisitWithWeb3();
      Tab.instant();
    });

    it('should display not connected warning and display trade details', () => {
      const trade = new Trade();
      trade.sell('ETH').amount('1');

      TradeData.expectPriceOf(/(280.00)/);
      TradeData.expectSlippageLimit(/5\.00%/);
      TradeData.expectPriceImpact(/0\.00%/);

      trade.resultsInError(/Connect wallet.../, 'bottom');
    });

    it('should display both not connected warning and not enough orders error', () => {
      const trade = new Trade();
      trade.sell('ETH').amount('100');

      trade.resultsInError(`No orders available to sell 100.00000 ETH`, 'top');
      trade.resultsInError(/Connect wallet.../, 'bottom');
    });
  });
});
