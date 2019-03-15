import { bindNodeCallback, concat, from, Observable, Subject } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import * as Web3 from 'web3';

import coinbaseSvg from '../icons/providers/coinbase.svg';
import ethereumSvg from '../icons/providers/ethereum.svg';
import imTokenSvg from '../icons/providers/im-token.svg';
import metamaskSvg from '../icons/providers/metamask.svg';
import paritySvg from '../icons/providers/parity.svg';
import statusSvg from '../icons/providers/status.svg';
import trustSvg from '../icons/providers/trust.svg';
import { SvgImageSimple } from '../utils/icons/utils';

export let web3 : Web3;

export type Web3Status = 'ready' | 'missing' | 'initializing';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'denied' | 'missing';

export interface Web3Window {
  web3?: any;
  ethereum?: any;
}

export interface ProviderMetaData {
  alias: string;
  fullName: string;
  icon: JSX.Element | string;
}

export const web3Status$: Observable<Web3Status> = from(['initializing']).pipe(
  map(() => {
    const win = window as Web3Window;
    if (win.web3) {
      web3 = new Web3(win.web3.currentProvider);
      return 'ready';
    }
    return 'missing';
  }),
  shareReplay(1),
);
web3Status$.subscribe();

export const connectToWallet$: Subject<void> = new Subject();
export const walletStatus$: Observable<WalletStatus> = concat(
  from([null]).pipe(
    switchMap(() => bindNodeCallback(web3.eth.getAccounts)()),
    map((x: string[]): WalletStatus => x[0] ? 'connected' : 'disconnected'),
  ),
  connectToWallet$.pipe(
    switchMap(() => {
      const win = window as Web3Window;
      if (win.ethereum) {
        web3 = new Web3(win.ethereum);
        return from(win.ethereum.enable()).pipe(
          map(() => 'connected'),
          startWith('connecting' as WalletStatus),
          catchError(() => from(['denied'])),
        );
      }
      return from(['missing' as WalletStatus]);
    }),
  ),
).pipe(
  shareReplay(1),
);
walletStatus$.subscribe();

export function setupFakeWeb3ForTesting() {
  web3 = new Web3();
}

export const getCurrentProviderName = (provider = (window as Web3Window).web3.currentProvider): ProviderMetaData => {
  if (provider.isMetaMask) {
    return {
      alias: 'metamask',
      fullName: 'Metamask',
      icon: SvgImageSimple(metamaskSvg),
    };
  }

  if (provider.isTrust) {
    return {
      alias: 'trust',
      fullName: 'Trust Wallet',
      icon: SvgImageSimple(trustSvg),
    };
  }

  if (provider.isStatus) {
    return {
      alias: 'status',
      fullName: 'Status',
      icon: SvgImageSimple(statusSvg),
    };
  }

  if (typeof (window as any).SOFA !== 'undefined') {
    return {
      alias: 'coinbase',
      fullName: 'Coinbase Wallet',
      icon: SvgImageSimple(coinbaseSvg),
    };
  }

  if (provider.constructor && provider.constructor.name === 'Web3FrameProvider') {
    return {
      alias: 'parity',
      fullName: 'Parity',
      icon: SvgImageSimple(paritySvg),
    };
  }

  if (provider.isImToken) {
    return {
      alias: 'imToken',
      fullName: 'imToken',
      icon: SvgImageSimple(imTokenSvg),
    };
  }

  if (provider.host && provider.host.indexOf('infura') !== -1) {
    return {
      alias: 'infura',
      fullName: 'Infura',
      icon: SvgImageSimple(ethereumSvg),
    };
  }

  if (provider.host && provider.host.indexOf('localhost') !== -1) {
    return {
      alias: 'self',
      fullName: 'Private Wallet',
      icon: SvgImageSimple(ethereumSvg)
    };
  }

  return {
    alias: 'other',
    fullName: 'Other',
    icon: SvgImageSimple(ethereumSvg)
  };
};
