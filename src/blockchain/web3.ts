import { from, fromEvent, Observable } from 'rxjs';
import { catchError, filter, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import * as Web3 from 'web3';
import { ProviderIcons } from '../utils/icons/ProviderIcons';

export let web3 : Web3;

export type Web3Status = 'waiting' | 'ready' | 'denied' | 'missing' | 'initializing';

export interface Web3Window {
  web3?: any;
  ethereum?: any;
}

export interface ProviderMetaData {
  alias: string;
  fullName: string;
  icon: JSX.Element | string;
}

export const web3Status$: Observable<Web3Status> = fromEvent(document, 'visibilitychange').pipe(
  startWith(null),
  filter(() => !web3),
  filter(() => !document.hidden),
  switchMap(() => {
    const win = window as Web3Window;
    if (win.ethereum) {
      web3 = new Web3(win.ethereum);
      return from(win.ethereum.enable()).pipe(
        map(() => 'ready'),
        startWith('waiting'),
        catchError(() => from(['denied'])),
      );
    }
    if (win.web3) {
      web3 = new Web3(win.web3.currentProvider);
      return from(['ready']);
    }
    return from(['missing']);
  }),
  shareReplay(1),
);
web3Status$.subscribe();

export const web3Ready$ = web3Status$.pipe(filter(status => status === 'ready'));

export function setupFakeWeb3ForTesting() {
  web3 = new Web3();
}

export const getCurrentProviderName = (provider = (window as Web3Window).web3.currentProvider): ProviderMetaData => {
  if (provider.isMetaMask) {
    return {
      alias:'metamask',
      fullName:'Metamask',
      icon:ProviderIcons.METAMASK
    };
  }

  if (provider.isTrust) {
    return {
      alias:'trust',
      fullName:'Trust Wallet',
      icon: ProviderIcons.TRUST
    };
  }

  if (provider.isStatus) {
    return {
      alias:'status',
      fullName:'Status',
      icon: ProviderIcons.STATUS
    };
  }

  if (typeof (window as any).SOFA !== 'undefined') {
    return {
      alias:'coinbase',
      fullName:'Coinbase Wallet',
      icon: ProviderIcons.COINBASE
    };
  }

  if (provider.constructor && provider.constructor.name === 'Web3FrameProvider') {
    return {
      alias:'parity',
      fullName:'Parity',
      icon: ProviderIcons.PARITY
    };
  }

  if (provider.isImToken) {
    return {
      alias:'imToken',
      fullName:'imToken',
      icon: ProviderIcons.IM_TOKEN
    };
  }

  if (provider.host && provider.host.indexOf('infura') !== -1) {
    return {
      alias:'infura',
      fullName:'Infura',
      icon: ProviderIcons.ETHEREUM
    };
  }

  if (provider.host && provider.host.indexOf('localhost') !== -1) {
    return {
      alias:'self',
      fullName:'Private Wallet',
      icon: ProviderIcons.ETHEREUM
    };
  }

  return {
    alias:'other',
    fullName:'Other',
    icon: ProviderIcons.ETHEREUM
  };
};
