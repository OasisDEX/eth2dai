import { WalletConnection } from '../pages/WalletConnection';
import { cypressVisitWithWeb3, tid } from '../utils';
import { makeScreenshots } from '../utils/makeScreenshots';

describe('Orderbook view ', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    WalletConnection.connect();
  });

  it('should render depth chart in the panel', () => {
    cy.wait(3000);
    cy.get(tid('orderbook-type-list')).click();

    makeScreenshots('depth-chart', ['macbook-15']);
  });
});
