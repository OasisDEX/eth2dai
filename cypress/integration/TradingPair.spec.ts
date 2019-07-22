import { WalletConnection } from '../pages/WalletConnection';
import { cypressVisitWithWeb3, tid } from '../utils';
import { makeScreenshots } from '../utils/makeScreenshots';

describe('Trading pair', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    WalletConnection.connect();
  });

  it('should display trading pair picker', () => {
    cy.get(tid('select-pair')).click();
    cy.wait(3000);
    makeScreenshots('trading-pair-picker-open');
  });
});
