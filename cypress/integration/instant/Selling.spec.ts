import { Tab } from '../../pages/Tab';
import { Trade } from '../../pages/Trade';
import { WalletConnection } from '../../pages/WalletConnection';
import { cypressVisitWithWeb3, tid } from '../../utils';

const nextTrade = () => {
  cy.get(tid('new-trade')).click();
};

describe('Selling', () => {
  beforeEach(() => {
    cypressVisitWithWeb3();
    WalletConnection.connect();
    Tab.instant();
  });

  context('ETH for ERC20 ', () => {
    it('without proxy', () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '1';
      const willReceive = '280';
      const price = '280 ETH/DAI';

      const trade = new Trade();
      trade.sell(from).amount(willPay);

      trade.expectToReceive(`${willReceive}.00`);

      const finalization = trade.execute();

      const summary = finalization
        .shouldCreateProxy()
        .shouldCommitATrade(`${willPay}.000`, from, `${willReceive}.00`, to);

      summary.expectProxyBeingCreated();
      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);
    });

    it('with proxy', () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '1';
      const willReceive = '280';
      const price = '280 ETH/DAI';

      const trade = new Trade();
      trade.sell(from).amount(willPay);

      trade.expectToReceive(`${willReceive}.00`);

      const finalization = trade
        .execute();

      const summary = finalization
        .shouldCreateProxy()
        .shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectProxyBeingCreated();
      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);

      nextTrade();

      const willReceiveMore = '275';
      const endPrice = '275 ETH/DAI';

      const secondTrade = new Trade();
      secondTrade.sell(from).amount(willPay);

      trade.expectToReceive(`${willReceiveMore}.00`);

      const anotherFinalization = secondTrade
        .execute();

      const anotherSummary = anotherFinalization
        .shouldNotCreateProxy()
        .shouldCommitATrade(willPay, from, willReceiveMore, to);

      anotherSummary.expectProxyNotBeingCreated();
      anotherSummary.expectBought(willReceiveMore, to);
      anotherSummary.expectSold(willPay, from);
      anotherSummary.expectPriceOf(endPrice);
    });
  });

  context('ERC20 for ETH', () => {
    it('without proxy and allowance', () => {
      const from = 'DAI';
      const to = 'ETH';
      const willPay = '100';
      const willReceive = '0.332';
      const price = '301 ETH/DAI';

      const trade = new Trade();
      trade.sell(from).amount(willPay);

      trade.expectToReceive(`${willReceive}`);

      const finalization = trade.execute();

      finalization.shouldCreateProxy().expectSuccess();
      finalization.shouldSetAllowanceFor(from).expectSuccess();

      const summary = finalization.shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectBought(willReceive, to);
      summary.expectSold('99.99', from);
      summary.expectPriceOf(price);
    });

    it('with proxy and no allowance', () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '1';
      const willReceive = '280';
      const price = '280 ETH/DAI';

      const trade = new Trade();
      trade.sell(from).amount(willPay);

      trade.expectToReceive(`${willReceive}.00`);

      const finalization = trade.execute();

      const summary = finalization
        .shouldCreateProxy()
        .shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectProxyBeingCreated();
      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);

      nextTrade();

      const willPayMore = '200';
      const willReceiveMore = '0.664';
      const newPrice = '301 ETH/DAI';

      const secondTrade = new Trade();
      secondTrade.buy(from);
      secondTrade.sell(to).amount(willPayMore);

      secondTrade.expectToReceive(`${willReceiveMore}`);

      const nextFinalization = secondTrade
        .execute();

      nextFinalization
        .shouldNotCreateProxy()
        .shouldSetAllowanceFor(to)
        .expectSuccess();

      const finalSummary = nextFinalization
        .shouldCommitATrade(willPayMore, to, willReceiveMore, from);

      finalSummary.expectProxyNotBeingCreated();
      finalSummary.expectBought(willReceiveMore, from);
      finalSummary.expectSold('199.99', to);
      finalSummary.expectPriceOf(newPrice);
    });

    it('with proxy and allowance', () => {
      const from = 'DAI';
      const to = 'ETH';
      const willPay = '100';
      const price = '301 ETH/DAI';

      const trade = new Trade();
      trade.sell(from).amount(willPay);
      trade.execute();

      nextTrade();

      const willPayMore = '70';
      const willReceiveMore = '0.232';

      const secondTrade = new Trade();
      secondTrade.sell(from).amount(willPayMore);

      secondTrade.expectToReceive(willReceiveMore);

      const finalization = secondTrade.execute();

      const summary = finalization
        .shouldNotCreateProxy()
        .shouldNotSetAllowance()
        .shouldCommitATrade(willPayMore, from, willReceiveMore, to);

      summary.expectProxyNotBeingCreated();
      summary.expectBought(willReceiveMore, to);
      summary.expectSold('69.99', from);
      summary.expectPriceOf(price);
    });
  });

  context('ERC20 for ERC20', () => {
    it('without proxy and allowance', () => {
      const from = 'DAI';
      const to = 'WETH';
      const willPay = '5';
      const willReceive = '0.016';
      const price = '301 WETH/DAI';

      const trade = new Trade();
      trade.buy(to);
      trade.sell(from).amount(willPay);

      trade.expectToReceive(`${willReceive}`);

      const finalization = trade.execute();

      finalization.shouldCreateProxy().expectSuccess();
      finalization.shouldSetAllowanceFor(from).expectSuccess();

      const summary = finalization.shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectBought(willReceive, to);
      summary.expectSold('4.99', from);
      summary.expectPriceOf(price);
    });

    it('with proxy and no allowance', () => {
      const from = 'WETH';
      const to = 'DAI';
      const willPay = '1';
      const willReceive = '280';
      const price = '280 WETH/DAI';

      const trade = new Trade();
      trade.sell(from).amount(willPay);

      trade.expectToReceive(`${willReceive}.00`);

      const finalization = trade.execute();

      const summary = finalization
        .shouldCreateProxy()
        .shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectProxyBeingCreated();
      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);

      nextTrade();

      const switchTo = 'WETH';
      const switchFrom = 'DAI';
      const willPayMore = '5';
      const willReceiveMore = '0.016';
      const newPrice = '301 WETH/DAI';

      const secondTrade = new Trade();
      secondTrade.buy(switchTo);
      secondTrade.sell(switchFrom).amount(willPayMore);

      secondTrade.expectToReceive(`${willReceiveMore}`);

      const nextFinalization = secondTrade.execute();

      nextFinalization
        .shouldNotCreateProxy()
        .shouldSetAllowanceFor(switchFrom)
        .expectSuccess();

      const finalSummary = nextFinalization
        .shouldCommitATrade(willPayMore, switchFrom, willReceiveMore, switchTo);

      finalSummary.expectProxyNotBeingCreated();
      finalSummary.expectBought(willReceiveMore, switchTo);
      finalSummary.expectSold('4.99', switchFrom);
      finalSummary.expectPriceOf(newPrice);
    });

    it('with proxy and allowance', () => {
      const from = 'DAI';
      const to = 'WETH';
      const willPay = '5';
      const willReceive = '0.016';
      const price = '301 WETH/DAI';

      const trade = new Trade();
      trade.buy(to);
      trade.sell(from).amount(willPay);
      trade.execute();

      nextTrade();

      const secondTrade = new Trade();
      secondTrade.buy(to);
      secondTrade.sell(from).amount(willPay);

      secondTrade.expectToReceive(willReceive);

      const finalization = trade.execute();

      const summary = finalization
        .shouldNotCreateProxy()
        .shouldNotSetAllowance()
        .shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectProxyNotBeingCreated();
      summary.expectBought(willReceive, to);
      summary.expectSold('4.99', from);
      summary.expectPriceOf(price);
    });
  });
});
