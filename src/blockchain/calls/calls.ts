import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ObservableItem } from '../../utils/observableItem';
import { NetworkConfig } from '../config';
import { context$, initializedAccount$ } from '../network';
import { approveWallet, disapproveWallet } from './approveCalls';
import {
  estimateGasCurried, sendTransactionCurried, sendTransactionWithGasConstraintsCurried
} from './callsHelpers';
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
  };
}

export const calls$ = combineLatest(context$, initializedAccount$).pipe(
  map(calls),
);

export type Calls$ = typeof calls$;

export type Calls = ObservableItem<Calls$>;

// (window as any).setupCalls = (): any | undefined => {
//   calls$.subscribe(calls => {
//     (window as any).calls = calls;
//   });
// };
