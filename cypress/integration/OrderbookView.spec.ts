import { ApplicationState } from '../pages/Application';
import { cypressVisitWithWeb3, tid } from '../utils';
import { makeScreenshots } from '../utils/makeScreenshots';

describe('Orderbook view ', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    ApplicationState.acceptToS();
  });

  it('should render depth chart in the panel', () => {
    cy.wait(1000);
    cy.get(tid('orderbook-type-list')).click();

    makeScreenshots('depth-chart');
  });
});