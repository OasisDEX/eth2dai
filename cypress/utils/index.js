import Web3 from "web3";
import PrivateKeyProvider from "truffle-privatekey-provider";

// this is exactly the same as ganache.sh file in localnode
const ACCOUNT_1_PRIV = "0x47be2b1589bb515b76b47c514be96b23cd60ee37e81d63c2ae9c92f7d7667e1a";
export const ACCOUNT_3_PRIV = "0x1ff8271bf14ac9bef0b641cced40dc2a7ebd2e37d8e16d25b4aa1911364219af";

export let web3;
export let lastSnapshotId = 1;

export function createWeb3Provider(privKey, providerUrl) {
  const provider = new PrivateKeyProvider(privKey.replace("0x", ""), providerUrl);
  return new Web3(provider);
}

export function cypressVisitWithWeb3(path = "") {
  web3 = createWeb3Provider(ACCOUNT_3_PRIV, Cypress.env("ETH_PROVIDER"));

  return cy
    .then(() => {
      cy.log(`Reverting blockchain to snapshot #${lastSnapshotId}`);
      return restoreBlockchain(web3)(lastSnapshotId);
    })
    .then(() => saveBlockchain(web3)())
    .then(r => {
      cy.log(`Saving snapshot #${lastSnapshotId}`);
      lastSnapshotId = parseInt(r.result, 16);

      return cy.visit(path, {
        onBeforeLoad: win => {
          win.web3 = web3;
        },
      });
    });
}

// helper to generate quickly selector for data-test-ids
export function tid(id, rest = "") {
  return `[data-test-id="${id}"]` + (rest ? ` ${rest}` : "");
}

export const promisify = func => async (...args) =>
  new Promise((accept, reject) => func(...args, (error, result) => (error ? reject(error) : accept(result))));

export const rpcCommand = method => web3Instance => (...params) => {
  return new Promise((resolve, reject) => {
    web3Instance.currentProvider.sendAsync(
      {
        id: Date.now(),
        jsonrpc: "2.0",
        method,
        params,
      },
      (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      },
    );
  });
};

export const mineBlock = rpcCommand("evm_mine");
export const increaseTime = rpcCommand("evm_increaseTime");
export const saveBlockchain = rpcCommand("evm_snapshot");
export const restoreBlockchain = rpcCommand("evm_revert");

export const multiply = (first, second) => {
  return (parseFloat(first) * parseFloat(second)).toString();
};

export const timeout = (milliSeconds = 40000) => ({timeout: milliSeconds});
