import * as Proxy from '../../pages/Proxy';
import { Tab } from '../../pages/Tab';
import { WalletConnection } from '../../pages/WalletConnection';
import { cypressVisitWithWeb3, tid } from '../../utils';

// Unless we need those for something else
// I guess we can leave the within the test.
const goToAllowances = () => {
  cy.get(tid('set-allowances')).click();
};

const setAllowanceOf = (token: string) => {
  cy.get(tid(token)).click();
};

const expectAllowanceStatusFor = (token: string, hasAllowance: 'true' | 'false') => {
  cy.get(tid(token, tid('status'))).should('have.attr', 'data-test-isallowed', hasAllowance);
};

const expectAllowedTokensCount = (count: number) => {
  cy.get(tid('active-allowances')).contains(`${count} Tokens enabled for Trading`);
};

const enum AllowanceStatus {
  ALLOWED = 'true',
  DISABLED = 'false'
}

describe('Proxy Allowance', () => {
  beforeEach(() => {
    cypressVisitWithWeb3();
    WalletConnection.connect();
    WalletConnection.isConnected();
    Tab.instant();
    Proxy.settings().click();
    Proxy.create();
  });

  it('should not be set initially', () => {
    Proxy.hasStatus(Proxy.ProxyStatus.ENABLED);
    expectAllowedTokensCount(0);
  });

  it('should set allowance to a single token', () =>   {
    Proxy.hasStatus(Proxy.ProxyStatus.ENABLED);
    goToAllowances();

    expectAllowanceStatusFor('WETH', AllowanceStatus.DISABLED);
    setAllowanceOf('WETH');
    expectAllowanceStatusFor('WETH', AllowanceStatus.ALLOWED);
  });

  it('should set allowance to two token at the same time', () => {
    Proxy.hasStatus(Proxy.ProxyStatus.ENABLED);
    goToAllowances();
    expectAllowanceStatusFor('WETH', AllowanceStatus.DISABLED);
    setAllowanceOf('WETH');

    expectAllowanceStatusFor('DAI', AllowanceStatus.DISABLED);
    setAllowanceOf('DAI');

    expectAllowanceStatusFor('WETH', AllowanceStatus.ALLOWED);
    expectAllowanceStatusFor('DAI', AllowanceStatus.ALLOWED);
  });

  it('should display allowance if one is set', () => {
    Proxy.hasStatus(Proxy.ProxyStatus.ENABLED);
    goToAllowances();

    expectAllowanceStatusFor('WETH', AllowanceStatus.DISABLED);
    setAllowanceOf('WETH');

    expectAllowanceStatusFor('WETH', AllowanceStatus.ALLOWED);

    cy.get(tid('close')).click();

    expectAllowedTokensCount(1);

    goToAllowances();

    expectAllowanceStatusFor('WETH', AllowanceStatus.ALLOWED);
  });

  it('should disable already set allowance', () => {
    Proxy.hasStatus(Proxy.ProxyStatus.ENABLED);
    goToAllowances();

    expectAllowanceStatusFor('WETH', AllowanceStatus.DISABLED);

    setAllowanceOf('WETH');

    expectAllowanceStatusFor('WETH', AllowanceStatus.ALLOWED);

    setAllowanceOf('WETH');

    expectAllowanceStatusFor('WETH', AllowanceStatus.DISABLED);
  });

  it('should go to proxy setting page if proxy is deleted',  () => {
    Proxy.hasStatus(Proxy.ProxyStatus.ENABLED);
    goToAllowances();

    expectAllowanceStatusFor('WETH', AllowanceStatus.DISABLED);

    setAllowanceOf('WETH');

    expectAllowanceStatusFor('WETH', AllowanceStatus.ALLOWED);

    Proxy.clear();

    Proxy.hasStatus(Proxy.ProxyStatus.MISSING);
  });
});
