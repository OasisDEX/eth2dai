import { from, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
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

export type Web3Status = 'ready' | 'readonly' | 'missing' | 'initializing';

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
    web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io'));
    return 'readonly';
  }),
  shareReplay(1),
);
web3Status$.subscribe();

export function setupFakeWeb3ForTesting() {
  web3 = new Web3();
}

export const getCurrentProviderName = (provider = ((window as Web3Window).web3 ? (window as Web3Window).web3.currentProvider : null)): ProviderMetaData => {
  if (!provider) {
    return {
      alias: 'other',
      fullName: 'Other',
      icon: SvgImageSimple(ethereumSvg)
    };
  }

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
