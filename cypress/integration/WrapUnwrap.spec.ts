import { ApplicationState } from '../pages/Application';
import { Balance } from '../pages/Balance';
import { Tab } from '../pages/Tab';
import { unwrapping, wrapping } from '../pages/WrapUnwrap';
import { cypressVisitWithWeb3 } from '../utils/index';

describe.skip('Wrapping ETH', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    ApplicationState.acceptToS();
    Tab.balances();
  });

  it('should succeed', () => {
    Tab.balances();

    Balance.of('ETH').shouldBe(/8,999.../);
    Balance.of('WETH').shouldBe(/1,001.../);

    wrapping('100').shouldProceed();

    Balance.of('ETH').shouldBe(/8,899.../);
    Balance.of('WETH').shouldBe(/1,101.../);
  });

  it('should not proceed when trying to wrap more than the balance', () => {
    Tab.balances();

    Balance.of('ETH').shouldBe(/8,999.../);
    Balance.of('WETH').shouldBe(/1,001.../);

   // extract constants from the WrapUnwrapFromView
    wrapping('10000').shouldFailWith(`Your ETH balance is too low`);

    Balance.of('ETH').shouldBe(/8,999.../);
    Balance.of('WETH').shouldBe(/1,001.../);
  });

  it('should not proceed when trying to wrap 0', () => {
    Tab.balances();

    Balance.of('ETH').shouldBe(/8,999.../);
    Balance.of('WETH').shouldBe(/1,001.../);

    // extract constants from the WrapUnwrapFromView
    wrapping('0').shouldFailWith(`Amount is too low`);

    Balance.of('ETH').shouldBe(/8,999.../);
    Balance.of('WETH').shouldBe(/1,001.../);
  });
});

describe.skip('Unwrapping ETH', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    ApplicationState.acceptToS();
    Tab.balances();
  });

  it('should succeeed', () => {
    Tab.balances();

    Balance.of('ETH').shouldBe(/8,999.../);
    Balance.of('WETH').shouldBe(/1,001.../);

    unwrapping('100').shouldProceed();

    Balance.of('ETH').shouldBe(/9,099.../);
    Balance.of('WETH').shouldBe(/901.../);
  });

  it('should not proceed when trying to unwrap more than the balance', () => {
    Tab.balances();

    Balance.of('ETH').shouldBe(/8,999.../);
    Balance.of('WETH').shouldBe(/1,001.../);

    // extract constants from the WrapUnwrapFromView
    unwrapping('10000').shouldFailWith(`Your WETH balance is too low`);

    Balance.of('ETH').shouldBe(/8,999.../);
    Balance.of('WETH').shouldBe(/1,001.../);
  });

  it('should not proceed when trying to unwrap 0', () => {
    Tab.balances();

    Balance.of('ETH').shouldBe(/8,999.../);
    Balance.of('WETH').shouldBe(/1,001.../);

    // extract constants from the WrapUnwrapFromView
    unwrapping('0').shouldFailWith(`Amount is too low`);

    Balance.of('ETH').shouldBe(/8,999.../);
    Balance.of('WETH').shouldBe(/1,001.../);
  });
});
