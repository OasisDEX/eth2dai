import { cypressVisitWithWeb3 } from '../utils/index';

import { ApplicationState } from '../pages/Application';
import { Balance } from '../pages/Balance';
import { Tab } from '../pages/Tab';
import { makeScreenshots } from '../utils/makeScreenshots';

describe.skip('Balances', () => {

  beforeEach(() => cypressVisitWithWeb3());

  it('should display all token balances', () => {
    ApplicationState.acceptToS();
    Tab.balances();

    Balance.of('ETH').shouldBe(/8,999.../);
    Balance.of('WETH').shouldBe(/1,001.../);
    Balance.of('DAI').shouldBe(/170.../);

    makeScreenshots('balances');
  });
});
