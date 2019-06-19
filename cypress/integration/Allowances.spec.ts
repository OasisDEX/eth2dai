import { Allowance, ALLOWANCE_STATE } from '../pages/Allowance';
import { Tab } from '../pages/Tab';
import { WalletConnection } from '../pages/WalletConnection';
import { cypressVisitWithWeb3 } from '../utils';

describe('Setting allowances', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    WalletConnection.connect();
    Tab.balances();
  });

  it('should enable allowance on a given token', () => {
    const allowance  = Allowance.of('WETH');

    allowance.shouldBe(ALLOWANCE_STATE.ENABLED);
    allowance.toggle();

    allowance.shouldBe(ALLOWANCE_STATE.DISABLED);
    allowance.toggle();

    allowance.shouldBe(ALLOWANCE_STATE.ENABLED);
  });

  it('should disable allowance on a given token', () => {
    const allowance  = Allowance.of('DAI');

    allowance.shouldBe(ALLOWANCE_STATE.ENABLED);
    allowance.toggle();

    allowance.shouldBe(ALLOWANCE_STATE.DISABLED);
    allowance.toggle();
  });
});
