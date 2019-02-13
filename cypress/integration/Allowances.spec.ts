import { Allowance, ALLOWANCE_STATE } from '../pages/Allowance';
import { ApplicationState } from '../pages/Application';
import { Tab } from '../pages/Tab';
import { cypressVisitWithWeb3 } from '../utils/index';

describe.skip('Setting allowances', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    ApplicationState.acceptToS();
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
