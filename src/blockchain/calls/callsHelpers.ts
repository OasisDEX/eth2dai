import { bindNodeCallback, Observable } from 'rxjs/index';
import { map } from 'rxjs/internal/operators';
import { NetworkConfig } from '../config';
import { send } from '../transactions';
import { TxMetaKind } from './txMeta';

export const DEFAULT_GAS = 1000000;

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
      return bindNodeCallback(
        call(args, context, account).call
      )(
        ...prepareArgs(args, context, account),
        { from: account }
      ).pipe(
        map(i => postprocess ? postprocess(i, args) : i)
      ) as Observable<R>;
    };
  };
}

export function estimateGasCurried(context: NetworkConfig, account: string) {
  return <D>(callData: GasDef<D>) => {
    return (args: D) => {
      const result = bindNodeCallback(
        callData.call(args, context, account).estimateGas
      )(
        ...callData.prepareArgs(args, context, account),
        { from: account, ...callData.options ? callData.options(args) : {} }
      );
      // @ts-ignore
      return result as Observable<number>;
    };
  };
}

export function sendTransactionCurried(context: NetworkConfig, account: string) {
  return <D>({ kind, description, call, prepareArgs, options }: TransactionDef<D>) => {
    return (args: D) => {
      return send(
        account,
        {
          kind,
          description,
          args
        },
        call(args, context, account).sendTransaction,
        ...prepareArgs(args, context, account),
        { from: account, ...options ? options(args) : {} },
      );
    };
  };
}
