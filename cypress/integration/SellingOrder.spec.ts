import { cypressVisitWithWeb3, multiply } from '../utils';

import { Balance } from '../pages/Balance';
import { Order } from '../pages/Order';
import { Orderbook, OrderType } from '../pages/Orderbook';
import { Tab } from '../pages/Tab';
import { Trades } from '../pages/Trades';
import { WalletConnection } from '../pages/WalletConnection';
import { makeScreenshots } from '../utils/makeScreenshots';

describe('Sell Order', () => {
  beforeEach(() => {
    cypressVisitWithWeb3();
    WalletConnection.connect();
  });

  it('should place a new order', () => {
    const price = '300';
    const amount = '1';

    const orders = Orderbook.list(OrderType.SELL);
    orders.countIs(4);
    makeScreenshots('new-order');

    new Order()
      .sell()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(price, amount))
      .place();

    orders.countIs(5);
    const lastOrder = orders.last();

    lastOrder.price().contains(new RegExp(`${price}...`));
    lastOrder.amount().contains(new RegExp(`${amount}...`));
    lastOrder.total().contains(/300.../);
  });

  it('should place a new order which is not the best one', () => {
    const price = '303';
    const amount = '2';

    const orders = Orderbook.list(OrderType.SELL);
    orders.countIs(4);

    new Order()
      .sell()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(price, amount))
      .place();

    orders.countIs(5);
    const lastOrder = orders.number(3);

    lastOrder.price().contains(new RegExp(`${price}...`));
    lastOrder.amount().contains(new RegExp(`${amount}...`));
    lastOrder.total().contains(/606.../);
  });

  it('should fill first buy order', () => {
    const price = '280';
    const amount = '1';

    const orders = Orderbook.list(OrderType.BUY);
    orders.countIs(3);

    new Order()
      .sell()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(price, amount))
      .place();

    orders.countIs(2);

    Tab.balances();

    Balance.of('DAI').shouldBe(/450.../);
  });

  it('should fill first buy order and place a new sell order with remainings', () => {
    const price = '280';
    const amount = '2';

    const buyOrders = Orderbook.list(OrderType.BUY);
    buyOrders.countIs(3);

    const sellOrders = Orderbook.list(OrderType.SELL);
    sellOrders.countIs(4);

    new Order()
      .sell()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(price, amount))
      .place();

    buyOrders.countIs(2);
    sellOrders.countIs(5);

    const lastOrder = sellOrders.last();

    lastOrder.price().contains(new RegExp(`${price}...`));
    lastOrder.amount().contains(/1.../);
    lastOrder.total().contains(/280.../);

    Tab.balances();

    Balance.of('DAI').shouldBe(/450.../);
  });

  it('should fill first buy order completely and second buy order partially', () => {
    const price = '275';
    const amount = '2';

    const buyOrders = Orderbook.list(OrderType.BUY);
    buyOrders.countIs(3);

    const sellOrders = Orderbook.list(OrderType.SELL);
    sellOrders.countIs(4);

    new Order()
      .sell()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(price, amount))
      .place();

    buyOrders.countIs(2);
    sellOrders.countIs(4);

    const firstOrder = buyOrders.first();
    firstOrder.amount().contains('1.01818');

    Tab.balances();

    Balance.of('DAI').shouldBe(/720.../);
  });

  it('should be displayed in my trades panel', () => {
    const price = '300';
    const amount = '1';

    Trades.countIs(2);

    new Order()
      .sell()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(price, amount))
      .place();

    Trades.countIs(3);

    const trade = Trades.first();
    trade.type().contains('sell');
    trade.price().contains(price);
    trade.amount().contains(amount);
    trade.total().contains('300');
  });

  it('should cancel a placed order', () => {
    const price = '300';
    const amount = '1';

    Trades.countIs(2);

    new Order()
      .sell()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(price, amount))
      .place();

    Trades.countIs(3);
    const trade = Trades.first();
    trade.cancel();

    Trades.countIs(2);
  });
});
