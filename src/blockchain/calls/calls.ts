import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ObservableItem } from '../../utils/observableItem';
import { NetworkConfig } from '../config';
import { context$, initializedAccount$ } from '../network';
import { approveWallet, disapproveWallet } from './approveCalls';
import {
  callCurried,
  estimateGasCurried,
  sendTransactionCurried,
  sendTransactionWithGasConstraintsCurried
} from './callsHelpers';
import {
  getBestOffer,
  getBuyAmount,
  getPayAmount,
  offers,
  proxyAddress$,
  tradePayWithETHNoProxy, tradePayWithETHWithProxy
} from './instant';
import { cancelOffer, offerMake, offerMakeDirect } from './offerMake';
import { unwrap, wrap } from './wrapUnwrapCalls';

function calls([context, account]: [NetworkConfig, string]) {

  const call = callCurried(context, account);
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
    otcGetBuyAmount: call(getBuyAmount),
    otcGetPayAmount: call(getPayAmount),
    otcGetBestOffer: call(getBestOffer),
    otcOffers: call(offers),
    proxyAddress: () => proxyAddress$(context, account)
  };
}

export const calls$ = combineLatest(context$, initializedAccount$).pipe(
  map(calls),
);

export type Calls$ = typeof calls$;

export type Calls = ObservableItem<Calls$>;
