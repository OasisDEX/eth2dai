import { Tab } from '../../pages/Tab';
import { Trade } from '../../pages/Trade';
import { WalletConnection } from '../../pages/WalletConnection';
import {
  ACCOUNT_3_PUBLIC,
  cypressVisitWithWeb3,
  INSTANT_PROXY_CREATE_AND_EXECUTE_ADDRESS,
  tid,
  toHex,
  verifySendTxs
} from '../../utils';

const nextTrade = () => {
  cy.get(tid('new-trade')).click();
};

describe('Buying', () => {
  beforeEach(() => {
    cypressVisitWithWeb3();
    WalletConnection.connect();
    Tab.instant();
  });

  context('ETH for ERC20', () => {
    it('without proxy', () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '0.357';
      const willReceive = '100';
      const price = '280 ETH/DAI';

      const trade = new Trade();
      trade.buy(to).amount(willReceive);

      trade.expectToPay(`${willPay}`);

      const finalization = trade.execute();

      const summary = finalization
        .shouldCreateProxy()
        .shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectProxyBeingCreated();
      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price).then(() => {
        verifySendTxs([{
          from: ACCOUNT_3_PUBLIC,
          to: INSTANT_PROXY_CREATE_AND_EXECUTE_ADDRESS,
          value: toHex('374999999999999999'),
        }]);
      });
    });

    it('with proxy', () => {
      const to = 'DAI';
      const from = 'ETH';
      const willReceive = '100';

      const trade = new Trade();
      trade.buy(to).amount(willReceive);

      trade.execute();

      nextTrade();

      const willReceiveMore = '500';
      const willPay = '1.806';
      const price = '276.78 ETH/DAI';

      const secondTrade = new Trade();
      secondTrade.buy(to).amount(willReceiveMore);

      secondTrade.expectToPay(willPay);

      const finalization = trade.execute();

      const summary = finalization
        .shouldNotCreateProxy()
        .shouldCommitATrade(willPay, from, willReceiveMore, to);

      summary.expectProxyNotBeingCreated();
      summary.expectBought(willReceiveMore, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);
    });
  });

  context('ERC20 for ETH', () => {
    it('without proxy and allowance', () => {
      const from = 'DAI';
      const to = 'ETH';
      const willPay = '37.02';
      const willReceive = '0.123';
      const price = '301 ETH/DAI';

      const trade = new Trade();
      trade.buy(to).amount(willReceive);

      trade.expectToPay(`${willPay}`);

      const finalization = trade.execute();

      finalization.shouldCreateProxy().expectSuccess();
      finalization.shouldSetAllowanceFor(from).expectSuccess();

      const summary = finalization.shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);
    });

    it('with proxy and no allowance', () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '1';

      const trade = new Trade();
      trade.buy(to);
      trade.sell(from).amount(willPay);
      trade.execute();

      nextTrade();

      const nextFrom = 'DAI';
      const nextTo = 'ETH';
      const nextWillPay = '37.02';
      const nextWillReceive = '0.123';
      const price = '301 ETH/DAI';

      const secondTrade = new Trade();
      secondTrade.sell(nextFrom);
      secondTrade.buy(nextTo).amount(nextWillReceive);

      secondTrade.expectToReceive(`${nextWillReceive}`);

      const nextFinalization = secondTrade.execute();

      nextFinalization
        .shouldNotCreateProxy()
        .shouldSetAllowanceFor(nextFrom)
        .expectSuccess();

      const finalSummary = nextFinalization
        .shouldCommitATrade(nextWillPay, nextFrom, nextWillReceive, nextTo);

      finalSummary.expectProxyNotBeingCreated();
      finalSummary.expectBought(nextWillReceive, nextTo);
      finalSummary.expectSold(nextWillPay, nextFrom);
      finalSummary.expectPriceOf(price);
    });

    it('with proxy and allowance', () => {
      const from = 'DAI';
      const to = 'ETH';
      const willPay = '37.02';
      const willReceive = '0.123';
      const price = '301 ETH/DAI';

      const trade = new Trade();
      trade.sell(from);
      trade.buy(to).amount(willReceive);
      trade.execute();

      nextTrade();

      const newTrade = new Trade();
      trade.sell(from);
      trade.buy(to).amount(willReceive);

      const finalization = newTrade.execute();

      const summary = finalization
        .shouldNotCreateProxy()
        .shouldNotSetAllowance()
        .shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);
    });
  });

  context('ERC20 for ERC20', () => {
    it('without proxy and allowance', () => {
      const from = 'DAI';
      const to = 'WETH';
      const willPay = '150.50';
      const willReceive = '0.5';
      const price = '301 WETH/DAI';

      const trade = new Trade();
      trade.sell(from);
      trade.buy(to).amount(willReceive);

      trade.expectToPay(`${willPay}`);

      const finalization = trade.execute();

      finalization.shouldCreateProxy().expectSuccess();
      finalization.shouldSetAllowanceFor(from).expectSuccess();

      const summary = finalization.shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);
    });

    it('with proxy and no allowance', () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '1';

      const trade = new Trade();
      trade.buy(to);
      trade.sell(from).amount(willPay);
      trade.execute();

      nextTrade();

      const nextFrom = 'DAI';
      const nextTo = 'WETH';
      const nextWillPay = '150.50';
      const nextWillReceive = '0.5';
      const price = '301 WETH/DAI';

      const secondTrade = new Trade();
      secondTrade.sell(nextFrom);
      secondTrade.buy(nextTo).amount(nextWillReceive);

      secondTrade.expectToReceive(`${nextWillReceive}`);

      const nextFinalization = secondTrade.execute();

      nextFinalization
        .shouldNotCreateProxy()
        .shouldSetAllowanceFor(nextFrom).expectSuccess();

      const finalSummary = nextFinalization
        .shouldCommitATrade(nextWillPay, nextFrom, nextWillReceive, nextTo);

      finalSummary.expectProxyNotBeingCreated();
      finalSummary.expectBought(nextWillReceive, nextTo);
      finalSummary.expectSold(nextWillPay, nextFrom);
      finalSummary.expectPriceOf(price);
    });

    it('with proxy and allowance', () => {
      const from = 'DAI';
      const to = 'WETH';
      const willReceive = '0.3';
      const price = '301 WETH/DAI';

      const trade = new Trade();
      trade.sell(from);
      trade.buy(to).amount(willReceive);
      trade.execute();

      nextTrade();

      const nextWillReceive = '0.1';
      const nextWillPay = '30.10';

      const newTrade = new Trade();
      newTrade.sell(from);
      newTrade.buy(to).amount(nextWillReceive);

      const finalization = newTrade.execute();

      const summary = finalization
        .shouldNotCreateProxy()
        .shouldNotSetAllowance()
        .shouldCommitATrade(nextWillPay, from, nextWillReceive, to);

      summary.expectBought(nextWillReceive, to);
      summary.expectSold(nextWillPay, from);
      summary.expectPriceOf(price);
    });
  });
});
