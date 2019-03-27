import { bindNodeCallback, combineLatest, Observable } from 'rxjs/index';
import { first, map, switchMap } from 'rxjs/internal/operators';
import { NetworkConfig } from '../config';
import { GasPrice$ } from '../network';
import { send } from '../transactions';
import { TxMetaKind } from './txMeta';

export interface BaseDef<A> {
  call: (args: A, context: NetworkConfig, account: string) => any;
  prepareArgs: (args: A, context: NetworkConfig, account: string) => any[];
}

export interface CallDef<A, R> extends BaseDef<A> {
  postprocess?: (r: any, a: A) => R;
}

export interface GasDef<A> extends BaseDef<A> {
  options?: (args: A) => any;
}

export interface TransactionDef<A> extends GasDef<A> {
  kind: TxMetaKind;
  description: (args: A) => JSX.Element;
  descriptionIcon?: (args: A) => JSX.Element;
}

export function callCurried(context: NetworkConfig, account: string) {
  return <D, R>({ call, prepareArgs, postprocess }: CallDef<D, R>) => {
    return (args: D) => {
      return bindNodeCallback(call(args, context, account).call)(
        ...prepareArgs(args, context, account),
        { from: account },
      ).pipe(
        map(i => (postprocess ? postprocess(i, args) : i))
      ) as Observable<R>;
    };
  };
}

export function estimateGasCurried(context: NetworkConfig, account: string) {
  return <D>(callData: GasDef<D>) => {
    return (args: D) => {
      const result = bindNodeCallback(callData.call(args, context, account).estimateGas)(
        ...callData.prepareArgs(args, context, account),
        { from: account, ...(callData.options ? callData.options(args) : {}) },
      ).pipe(
        map((e: number) => {
          return Math.floor(e * GAS_ESTIMATION_MULTIPLIER);
        }),
      );
      // @ts-ignore
      return result as Observable<number>;
    };
  };
}

// we accommodate for the fact that blockchain state can be different when tx execute and it can take more gas
const GAS_ESTIMATION_MULTIPLIER = 1.3;

export function sendTransactionCurried(context: NetworkConfig, account: string) {
  return <D>({
    kind,
    description,
    descriptionIcon,
    call,
    prepareArgs,
    options,
  }: TransactionDef<D>) => {
    return (args: D) => {
      return send(
        account,
        context.id,
        {
          kind,
          description,
          descriptionIcon,
          args,
        },
        call(args, context, account).sendTransaction,
        ...prepareArgs(args, context, account),
        { from: account, ...(options ? options(args) : {}) },
      );
    };
  };
}

export function sendTransactionWithGasConstraintsCurried(context: NetworkConfig, account: string) {
  return <D>(callData: TransactionDef<D>) => {
    return (gasPrice$: GasPrice$, args: D) => {
      const { kind, description, descriptionIcon, call, prepareArgs, options } = callData;

      return combineLatest(estimateGasCurried(context, account)(callData)(args), gasPrice$).pipe(
        first(),
        switchMap(([gas, gasPrice]) => {
          return send(
            account,
            context.id,
            {
              kind,
              description,
              descriptionIcon,
              args,
            },
            call(args, context, account).sendTransaction,
            ...prepareArgs(args, context, account),
            {
              from: account,
              ...(options ? options(args) : {}),
              gas,
              gasPrice,
            },
          );
        }),
      );
    };
  };
}
