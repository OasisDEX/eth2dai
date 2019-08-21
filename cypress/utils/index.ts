import * as BigNumber from 'bignumber.js';
// tslint:disable-next-line
import PrivateKeyProvider from 'truffle-privatekey-provider';
// tslint:disable-next-line
import Web3 from 'web3';

// this is exactly the same as ganache.sh file in localnode
export const ACCOUNT_3_PRIV = '0x1ff8271bf14ac9bef0b641cced40dc2a7ebd2e37d8e16d25b4aa1911364219af';
export const ACCOUNT_3_PUBLIC = '0x79d7176ae8f93a04bc73b9bc710d4b44f9e362ce';

// tslint:disable-next-line:max-line-length
export const INSTANT_PROXY_CREATE_AND_EXECUTE_ADDRESS = '0x2aD8bbFBA09e2fe0a5394E6B4709323EeDbbFD19';

export let web3: any;
export let lastSnapshotId = 1;

export function createWeb3Provider(privKey: string, providerUrl: string) {
  const provider = new PrivateKeyProvider(privKey.replace('0x', ''), providerUrl);
  return new Web3(provider);
}

export function cypressVisitWithoutProvider(path = '') {
  return cy.then(() => {
    return cy.visit(path);
  });
}

export function cypressVisitWithWeb3(path = '') {
  web3 = createWeb3Provider(ACCOUNT_3_PRIV, Cypress.env('ETH_PROVIDER'));

  cy.spy(web3._requestManager.provider, 'sendAsync');

  return cy
    .then(() => {
      cy.log(`Reverting blockchain to snapshot #${lastSnapshotId}`);
      return restoreBlockchain(web3)(lastSnapshotId);
    })
    .then(() => saveBlockchain(web3)())
    .then((r: any) => {
      cy.log(`Saving snapshot #${lastSnapshotId}`);
      lastSnapshotId = parseInt(r.result, 16);

      return cy.visit(path, {
        onBeforeLoad: win => {
          (win as any).web3 = web3;
        },
      });
    });
}

interface SimpleTx {
  from: string;
  to: string;
  value: string;
}

export function verifySendTxs(expectedTxs: SimpleTx[]) {
  const spiedSendAsync = web3._requestManager.provider.sendAsync as sinon.SinonSpy;

  const sendTxs = spiedSendAsync.getCalls().filter(c => c.args[0].method === 'eth_sendTransaction');

  const simplifiedTxs: SimpleTx[] = sendTxs.map(tx => {
    const params = tx.args[0].params[0];

    return {
      from: params.from,
      to: params.to,
      value: params.value,
    };
  });

  expect(simplifiedTxs).to.be.deep.eq(expectedTxs);
}

// helper to generate quickly selector for data-test-ids
export function tid(id: string, rest = '') {
  return `[data-test-id="${id}"]` + (rest ? ` ${rest}` : '');
}

export const promisify = (func: any) => async (...args: any[]) =>
  new Promise<any>((accept: any, reject: any) =>
    func(...args, (error: any, result: any) => (error ? reject(error) : accept(result))),
  );

export const rpcCommand = (method: any) => (web3Instance: any) => (...params: any[]) => {
  return new Promise<any>((resolve, reject) => {
    web3Instance.currentProvider.sendAsync(
      {
        method,
        params,
        id: Date.now(),
        jsonrpc: '2.0',
      },
      (err: any, res: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      },
    );
  });
};

export const mineBlock = rpcCommand('evm_mine');
export const increaseTime = rpcCommand('evm_increaseTime');
export const saveBlockchain = rpcCommand('evm_snapshot');
export const restoreBlockchain = rpcCommand('evm_revert');

export const multiply = (first: string, second: string) => {
  return (parseFloat(first) * parseFloat(second)).toString();
};

export const timeout = (milliSeconds = 40000) => ({ timeout: milliSeconds });

// NOTE: this includes 0x prefix
export function toHex(n: string | number): string {
  // tslint:disable-next-line
  return '0x' + new BigNumber.BigNumber(n, 10).toString(16);
}
