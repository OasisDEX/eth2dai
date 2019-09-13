import { Allowance, ALLOWANCE_STATE } from '../pages/Allowance';
import { Order } from '../pages/Order';
import { Orderbook, OrderType } from '../pages/Orderbook';
import { Tab } from '../pages/Tab';
import { WalletConnection } from '../pages/WalletConnection';
import { cypressVisitWithWeb3, multiply, tid } from '../utils';

describe('Trading pair', () => {

  // TODO: Figure out a way to import files from ./src
  // Right now there is compilation error when test suits are ran
  // It looks like proper webpack-preprocessor configuration but it's not working for some reason
  const tradingPairs = [
    { base: 'WETH', quote: 'DAI' },
    { base: 'DGD', quote: 'DAI' },
    { base: 'REP', quote: 'DAI' },
    { base: 'ZRX', quote: 'DAI' },
    { base: 'BAT', quote: 'DAI' }
  ];

  beforeEach(() => {
    cypressVisitWithWeb3();
    WalletConnection.connect();
    WalletConnection.isConnected();
    Tab.market();
  });

  it.skip('should display available markets', () => {
    cy.get(tid('select-pair')).click();
    // cy.wait(1000);
    // makeScreenshots('trading-pair-picker-open');

    tradingPairs.forEach((pair) => {
      cy.get(tid(`${pair.base}-${pair.quote}`, tid('base'))).contains(pair.base);
      cy.get(tid(`${pair.base}-${pair.quote}`, tid('quote'))).contains(pair.quote);
      cy.get(tid(`${pair.base}-${pair.quote}`, tid('price'))).contains('-');
      cy.get(tid(`${pair.base}-${pair.quote}`, tid('price-diff'))).contains('-');
    });
  });

  it.skip('should select different market', () => {
    cy.get(tid('active-pair', tid('base'))).contains('WETH');
    cy.get(tid('active-pair', tid('quote'))).contains('DAI');

    cy.get(tid('select-pair')).click();

    cy.get(tid('REP-DAI')).click();

    cy.get(tid('active-pair', tid('base'))).contains('REP');
    cy.get(tid('active-pair', tid('quote'))).contains('DAI');
  });

  it.skip('should display buy orders for selected pair', () => {
    cy.get(tid('select-pair')).click();

    cy.get(tid('REP-DAI')).click();

    const buyOrders = Orderbook.list(OrderType.BUY);
    buyOrders.countIs(1);
    buyOrders.first().amount().contains('1.00000');
    buyOrders.first().price().contains('110.00');
    buyOrders.first().total().contains('110.00');

    const sellOrders = Orderbook.list(OrderType.SELL);
    sellOrders.countIs(1);
    sellOrders.first().amount().contains('1.00000');
    sellOrders.first().price().contains('150.00');
    sellOrders.first().total().contains('150.00');
  });

  it.skip('should place new buy order for selected pair', () => {
    cy.get(tid('select-pair')).click();

    cy.get(tid('ZRX-DAI')).click();

    let sellOrders = Orderbook.list(OrderType.SELL);

    sellOrders.countIs(1);
    sellOrders.first().amount().contains('1.00000');
    sellOrders.first().price().contains('140.00');
    sellOrders.first().total().contains('140.00');

    let buyOrders = Orderbook.list(OrderType.BUY);
    buyOrders.countIs(0);

    const amount = '2';
    const price = '120';

    new Order()
      .buy()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(amount, price))
      .place();

    sellOrders = Orderbook.list(OrderType.SELL);
    sellOrders.countIs(1);

    buyOrders = Orderbook.list(OrderType.BUY);
    buyOrders.countIs(1);
    buyOrders.first().amount().contains('2.00000');
    buyOrders.first().price().contains('120.00');
    buyOrders.first().total().contains('240.00');
  });

  it.skip('should place new sell order for selected pair', () => {
    Tab.balances();

    const allowance = Allowance.of('REP');
    allowance.toggle();
    allowance.shouldBe(ALLOWANCE_STATE.ENABLED);

    Tab.market();

    cy.get(tid('select-pair')).click();
    cy.get(tid('REP-DAI')).click();

    let sellOrders = Orderbook.list(OrderType.SELL);

    sellOrders.countIs(1);
    sellOrders.first().amount().contains('1.00000');
    sellOrders.first().price().contains('150.00');
    sellOrders.first().total().contains('150.00');

    let buyOrders = Orderbook.list(OrderType.BUY);
    buyOrders.countIs(1);
    buyOrders.first().amount().contains('1.00000');
    buyOrders.first().price().contains('110.00');
    buyOrders.first().total().contains('110.00');

    const amount = '2';
    const price = '160';

    new Order()
      .sell()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(amount, price))
      .place();

    buyOrders = Orderbook.list(OrderType.BUY);
    buyOrders.countIs(1);

    sellOrders = Orderbook.list(OrderType.SELL);
    sellOrders.countIs(2);
    sellOrders.first().amount().contains('2.00000');
    sellOrders.first().price().contains('160.00');
    sellOrders.first().total().contains('320.00');
  });

  it('should fill a sell order and place a new buy order', () => {
    Tab.balances();

    const allowance = Allowance.of('ZRX');
    allowance.toggle();
    allowance.shouldBe(ALLOWANCE_STATE.ENABLED);

    Tab.market();

    cy.get(tid('select-pair')).click();
    cy.get(tid('ZRX-DAI')).click();

    const amount = '1';
    const price = '140';

    let sellOrders = Orderbook.list(OrderType.SELL);

    sellOrders.countIs(1);
    sellOrders.first().amount().contains('1.00000');
    sellOrders.first().price().contains('140.00');
    sellOrders.first().total().contains('140.00');

    // let buyOrders = Orderbook.list(OrderType.BUY);
    // buyOrders.countIs(0);

    cy.wait(1000);

    new Order()
      .buy()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(amount, price))
      .place();
    //
    // cy.wait(5000);
    //
    // new Order()
    //   .buy()
    //   .limit()
    //   .amount(amount)
    //   .atPrice('150.00')
    //   .total(multiply(amount, '150.00'))
    //   .place();

    sellOrders = Orderbook.list(OrderType.SELL);
    sellOrders.countIs(0);

    // buyOrders = Orderbook.list(OrderType.BUY);
    // buyOrders.countIs(1);
  });
});
