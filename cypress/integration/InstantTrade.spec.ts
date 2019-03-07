import { ApplicationState } from '../pages/Application';
import { Tab } from '../pages/Tab';
import { Trade } from '../pages/Trade';
import { TradeData } from '../pages/TradeData';
import { cypressVisitWithWeb3, tid, timeout } from '../utils';
import { makeScreenshots } from '../utils/makeScreenshots';

const waitForBalancesToLoad = () => {
  cy.get(tid('selling-token', tid('balance')), timeout()).contains(/8,999.../);
  cy.get(tid('buying-token', tid('balance')), timeout()).contains(/170.../);
};

const swap = () => cy.get(tid('swap'), timeout(1000)).click();

describe('Instant trade', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    ApplicationState.acceptToS();
    Tab.instant();
    waitForBalancesToLoad();
  });

  it('should calculate how much the user will receive', () => {
    const trade = new Trade().sell().amount('2');
    expect(trade).to.receive('555.00');

    TradeData.expectPriceOf(/(277\.50)/);
    TradeData.expectSlippageLimit(/2\.5%/);
    TradeData.expectPriceImpact(/0\.89%/);

    makeScreenshots('instant-trade');
  });

  it('should calculate how much the user will pay', () => {
    const trade = new Trade().buy().amount('320.00');
    expect(trade).to.pay('1.14545');

    TradeData.expectPriceOf(/(279\.36)/);
    TradeData.expectSlippageLimit(/2\.5%/);
    TradeData.expectPriceImpact(/0\.22%/);
  });

  it('should remove how much the user will receive if the pay value is cleared', () => {
    const trade = new Trade();
    const sell = trade.sell();
    sell.amount('0.5');

    expect(trade).to.receive('140.00');

    sell.clear();

    expect(trade).to.receive('');
  });

  it('should remove how much the user will pay if the buy value is cleared', () => {
    const trade = new Trade();
    const buy = trade.buy();
    buy.amount('140');

    expect(trade).to.pay('0.50000');

    buy.clear();

    expect(trade).to.pay('');
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
});
