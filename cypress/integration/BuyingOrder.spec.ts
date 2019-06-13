import { cypressVisitWithWeb3, multiply } from '../utils/index';

import { Balance } from '../pages/Balance';
import { Order } from '../pages/Order';
import { Orderbook, OrderType } from '../pages/Orderbook';
import { Tab } from '../pages/Tab';
import { Trades } from '../pages/Trades';
import { WalletConnection } from '../pages/WalletConnection';

describe('Buy Order', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    WalletConnection.connect();
    // Doing this because I don't have have enough funds on this account :)
    Trades
        .first()
        .cancel();
    Trades.countIs(1);
  });

  it('should place a new order', () => {
    const price = '280';
    const amount = '1';

    const orders = Orderbook.list(OrderType.BUY);
    orders.countIs(2);

    new Order()
      .buy()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(amount, price))
      .place();

    orders.countIs(3);
    const lastOrder = orders.first();

    lastOrder.price().contains(new RegExp(`${price}...`));
    lastOrder.amount().contains(new RegExp(`${amount}...`));
    lastOrder.total().contains(/280../);
  });

  it('should place a new order which is not the best one', () => {
    const price = '270';
    const amount = '1.5';

    const orders = Orderbook.list(OrderType.BUY);
    orders.countIs(2);

    new Order()
      .buy()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(amount, price))
      .place();

    orders.countIs(3);
    const lastOrder = orders.number(2);

    lastOrder.price().contains(new RegExp(`${price}...`));
    lastOrder.amount().contains(new RegExp(`${amount}...`));
    lastOrder.total().contains(/405.../);
  });

  it('should fill first sell order', () => {
    const price = '301';
    const amount = '1';

    const sellOrders = Orderbook.list(OrderType.SELL);
    sellOrders.countIs(4);

    const buyOrders = Orderbook.list(OrderType.BUY);
    buyOrders.countIs(2);

    new Order()
      .buy()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(amount, price))
      .place();

    sellOrders.countIs(3);
    buyOrders.countIs(2);

    Tab.balances();

    Balance.of('DAI').shouldBe(/149.../);
  });

  it('should fill first buy order and place a new sell order with remainings', () => {
    const price = '301';
    const amount = '1.2';

    const buyOrders = Orderbook.list(OrderType.BUY);
    buyOrders.countIs(2);

    const sellOrders = Orderbook.list(OrderType.SELL);
    sellOrders.countIs(4);

    new Order()
      .buy()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(amount, price))
      .place();

    buyOrders.countIs(3);
    sellOrders.countIs(3);

    const lastOrder = buyOrders.first();

    lastOrder.price().contains(new RegExp(`${price}...`));
    lastOrder.amount().contains(/0.2.../);
    lastOrder.total().contains('60.20');
  });

  it('should fill first buy order completely and second buy order partially', () => {
    const price = '302';
    const amount = '1.2';

    const buyOrders = Orderbook.list(OrderType.BUY);
    buyOrders.countIs(2);

    const sellOrders = Orderbook.list(OrderType.SELL);
    sellOrders.countIs(4);

    new Order()
      .buy()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(amount, price))
      .place();

    buyOrders.countIs(2);
    sellOrders.countIs(3);

    const lastOrder = sellOrders.last();
    lastOrder.price().contains('302');
    lastOrder.amount().contains('0.8');
    lastOrder.total().contains('241.60');
  });

  it('should be displayed in my trades panel', () => {
    const price = '280';
    const amount = '1';

    Trades.countIs(1);

    new Order()
      .buy()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(amount, price))
      .place();

    Trades.countIs(2);

    const trade = Trades.first();
    trade.type().contains('buy');
    trade.price().contains(price);
    trade.amount().contains(amount);
    trade.total().contains('280');
  });

  it('should cancel a placed order', () => {
    const price = '280';
    const amount = '1';

    Trades.countIs(1);

    new Order()
      .buy()
      .limit()
      .amount(amount)
      .atPrice(price)
      .total(multiply(amount, price))
      .place();

    Trades.countIs(2);
    const trade = Trades.first();
    trade.cancel();

    Trades.countIs(1);
  });
});
