import { ApplicationState } from '../../pages/Application';
import { Order } from '../../pages/Order';
import { Orderbook, OrderType } from '../../pages/Orderbook';
import { Tab } from '../../pages/Tab';
import { Trade } from '../../pages/Trade';
import { TradeData } from '../../pages/TradeData';
import { cypressVisitWithWeb3, multiply, tid, timeout } from '../../utils';
import { makeScreenshots } from '../../utils/makeScreenshots';

const waitForBalancesToLoad = () => {
  cy.get(tid('selling-token', tid('balance')), timeout()).contains(/8,999.../);
  cy.get(tid('buying-token', tid('balance')), timeout()).contains(/170.../);
};

const swap = () => cy.get(tid('swap'), timeout(1000)).click();

describe('New trade', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    ApplicationState.acceptToS();
    Tab.instant();
    waitForBalancesToLoad();
  });

  it('should calculate how much the user will receive', () => {
    const trade = new Trade();
    trade.sell().amount('2');
    trade.expectToReceive('555.00');

    TradeData.expectPriceOf(/(277\.50)/);
    TradeData.expectSlippageLimit(/2\.5%/);
    TradeData.expectPriceImpact(/0\.89%/);

    makeScreenshots('instant-trade');
  });

  it('should calculate how much the user will pay', () => {
    const trade = new Trade();
    trade.buy().amount('320.00');
    trade.expectToPay('1.14545');

    TradeData.expectPriceOf(/(279\.37)/);
    TradeData.expectSlippageLimit(/2\.5%/);
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

    trade.expectToPay('0.50000');

    buy.clear();

    trade.expectToPay('');
  });

  it('should allow swapping the tokens', () => {
    swap();

    cy.get(tid('selling-token', tid('balance')), timeout()).contains(/170.../);
    cy.get(tid('buying-token', tid('balance')), timeout()).contains(/8,999.../);
  });

  it('should clear input fields if populated on swap', () => {
    new Trade().sell().amount('280.00');

    swap();

    cy.get(tid('selling-token', tid('balance')), timeout()).contains(/170.../);
    cy.get(tid('buying-token', tid('balance')), timeout()).contains(/8,999.../);
  });

  it('should display error if balance is too low', () => {
    swap();

    const trade = new Trade();
    trade.sell().amount('200');
    // Find a way to evaluate the error content returned from the mapping ( no hardcoded values )
    trade.resultsInError(`You don't have 200.00 DAI in your wallet`);
  });

  it('should highlight the price impact in the trade details', () => {
    Tab.exchange();

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

    makeScreenshots('price-impact-highlight');

    trade.expectPriceImpact(`19.28%`, true);
  });

  it('should display warning message if the price impact is higher than threshold', () => {
    Tab.exchange();

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
    finalization.shoulHavePriceImpactWarning();
    finalization.acceptPriceImpact();

    finalization.shouldCreateProxy();
  });

  it('should keep trade date and not continue with transaction if price impact warning is dismissed', () => {
    Tab.exchange();

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
    finalization.shoulHavePriceImpactWarning();
    finalization.dismissPriceImpact();

    trade.expectPriceImpact('19.28%', true);
    trade.expectToReceive('1,130.00');
    trade.expectToPay('5.00000');
  });
});
