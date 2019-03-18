import { ApplicationState } from '../pages/Application';
import { cypressVisitWithWeb3, tid } from '../utils';
import { makeScreenshots } from '../utils/makeScreenshots';

describe.skip('Orderbook view ', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    ApplicationState.acceptToS();
  });

  it('should render depth chart in the panel', () => {
    cy.wait(3000);
    cy.get(tid('orderbook-type-list')).click();

    makeScreenshots('depth-chart', ['macbook-15']);
  });
});
