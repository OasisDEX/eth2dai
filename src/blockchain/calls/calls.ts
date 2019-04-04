import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ObservableItem } from '../../utils/observableItem';
import { NetworkConfig } from '../config';
import { context$, initializedAccount$ } from '../network';
import { approveProxy, approveWallet, disapproveProxy, disapproveWallet } from './approveCalls';
import {
  callCurried,
  estimateGasCurried,
  sendTransactionCurried,
  sendTransactionWithGasConstraintsCurried
} from './callsHelpers';
import {
  getBestOffer,
  getBuyAmount,
  getOffersAmount,
  getPayAmount,
  offers,
  proxyAddress$, setOwner, setupProxy, tradePayWithERC20,
  tradePayWithETHNoProxy, tradePayWithETHWithProxy
} from './instant';
import { cancelOffer, offerMake, offerMakeDirect } from './offerMake';
import { unwrap, wrap } from './wrapUnwrapCalls';

function calls([context, account]: [NetworkConfig, string]) {
  const estimateGas = estimateGasCurried(context, account);
  const sendTransaction = sendTransactionCurried(context, account);
  const sendTransactionWithGasConstraints = sendTransactionWithGasConstraintsCurried(context, account);

  return {
    cancelOffer: sendTransactionWithGasConstraints(cancelOffer),
    offerMake: sendTransaction(offerMake),
    offerMakeDirect: sendTransaction(offerMakeDirect),
    offerMakeEstimateGas: estimateGas(offerMake),
    offerMakeDirectEstimateGas: estimateGas(offerMakeDirect),
    approveWallet: sendTransactionWithGasConstraints(approveWallet),
    disapproveWallet: sendTransactionWithGasConstraints(disapproveWallet),
    wrap: sendTransaction(wrap),
    wrapEstimateGas: estimateGas(wrap),
    unwrap: sendTransaction(unwrap),
    unwrapEstimateGas: estimateGas(unwrap),
    tradePayWithETHNoProxy: sendTransaction(tradePayWithETHNoProxy),
    tradePayWithETHWithProxy: sendTransaction(tradePayWithETHWithProxy),
    tradePayWithERC20: sendTransaction(tradePayWithERC20),
    tradePayWithETHNoProxyEstimateGas: estimateGas(tradePayWithETHNoProxy),
    tradePayWithETHWithProxyEstimateGas: estimateGas(tradePayWithETHWithProxy),
    tradePayWithERC20EstimateGas: estimateGas(tradePayWithERC20),
    proxyAddress: () => proxyAddress$(context, account),
    setupProxy: sendTransaction(setupProxy),
    setupProxyEstimateGas: estimateGas(setupProxy),
    approveProxy: sendTransaction(approveProxy),
    approveProxyEstimateGas: estimateGas(approveProxy),
    disapproveProxy: sendTransaction(disapproveProxy),
    setOwner: sendTransaction(setOwner),
  };
}

function readCalls(context: NetworkConfig) {
  const call = callCurried(context);

  return {
    otcGetBuyAmount: call(getBuyAmount),
    otcGetPayAmount: call(getPayAmount),
    otcGetOffersAmount: call(getOffersAmount),
    otcGetBestOffer: call(getBestOffer),
    otcOffers: call(offers),
  };
}

export const calls$ = combineLatest(context$, initializedAccount$).pipe(
  map(calls),
);

export const readCalls$ = context$.pipe(
  map(readCalls),
);

export type Calls$ = typeof calls$;

export type Calls = ObservableItem<Calls$>;

export type ReadCalls$ = typeof readCalls$;

export type ReadCalls = ObservableItem<ReadCalls$>;
