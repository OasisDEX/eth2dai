import { fromPairs, memoize, zip } from 'lodash';

import { TradingPair } from '../exchange/tradingPair/tradingPair';
import * as eth from './abi/ds-eth-token.abi.json';
import * as erc20 from './abi/erc20.abi.json';
import * as otc from './abi/matching-market.abi.json';
import * as otcSupport from './abi/otc-support-methods.abi.json';
import * as saiTub from './abi/sai-tub.abi.json';
import {
  DAIcoin,
  DAIicon,
  ETHcoin,
  ETHicon,
} from './coinIcons/coinIcons';
import { web3 } from './web3';

export const tradingPairs: TradingPair[] = [
  { base: 'WETH', quote: 'DAI' },
];

function asMap<D>(key: string, data: D[]): { [key: string]: D } {
  return fromPairs(zip(data.map((row: D) => (row as any)[key]), data));
}

export const tokens = asMap('symbol', [
  {
    symbol: 'ETH',
    precision: 18,
    digits: 5,
    maxSell: '1000000000000000',
    name: 'Ether',
    icon: ETHicon,
    iconInverse: ETHcoin,
  },
  {
    symbol: 'WETH',
    precision: 18,
    digits: 5,
    maxSell: '1000000000000000',
    name: 'Wrapped Ether',
    icon: ETHicon,
    iconInverse: ETHcoin,
  },
  {
    symbol: 'DAI',
    precision: 18,
    digits: 2,
    maxSell: '1000000000000000',
    name: 'Dai',
    icon: DAIicon,
    iconInverse: DAIcoin,
  },
]);

const load = memoize(
  (abi: any, address: string) => {
    return {
      address,
      contract: web3.eth.contract(abi).at(address)
    };
  },
  (_abi: any, address: string) => address
);

function loadToken(token: string, abi: any, address: string) {
  return { token, ...load(abi, address) };
}

const protoMain = {
  id: '1',
  name: 'main',
  label: 'Mainnet',
  safeConfirmations: 0,
  avgBlocksPerDay: 5760 * 1.05,
  startingBlock: 4751582,
  get otc() { return load(otc, '0xB7ac09C2c0217B07d7c103029B4918a2C401eeCB'); },
  get saiTub() { return load(saiTub, '0x448a5065aebb8e423f0896e6c5d525c040f59af3'); },
  get tokens() {
    return asMap('token', [
      loadToken('WETH', eth, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
      loadToken('DAI', erc20, '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'),
    ]);
  },
  get otcSupportMethods() {
    return load(otcSupport, '0x9b3f075b12513afe56ca2ed838613b7395f57839');
  },
  oasisDataService: {
    url: 'https://oasisvulcan0x.makerfoundation.com/v1'
  },
  etherscan: {
    url: 'https://etherscan.io',
  },
};

export type NetworkConfig = typeof protoMain;

const main: NetworkConfig = protoMain;

const kovan: NetworkConfig = {
  id: '42',
  name: 'kovan',
  label: 'Kovan',
  safeConfirmations: 0,
  avgBlocksPerDay: 21600 * 0.55,
  startingBlock: 5216718,
  get otc() { return load(otc, '0xdB3b642eBc6Ff85A3AB335CFf9af2954F9215994'); },
  get saiTub() { return load(saiTub, '0xa71937147b55deb8a530c7229c442fd3f31b7db2'); },
  get tokens() {
    return asMap('token', [
      loadToken('WETH', eth, '0xd0a1e359811322d97991e03f863a0c30c2cf029c'),
      loadToken('DAI', erc20, '0xc4375b7de8af5a38a93548eb8453a498222c4ff2'),
    ]);
  },
  get otcSupportMethods() {
    return load(otcSupport, '0x303f2bf24d98325479932881657f45567b3e47a8');
  },
  oasisDataService: {
    url: 'https://kovan-oasisvulcan0x.makerfoundation.com/v1'
  },
  etherscan: {
    url: 'https://kovan.etherscan.io',
  },
};

const localnet: NetworkConfig =   {
  id: '420',
  name: 'localnet',
  label: 'Localnet',
  safeConfirmations: 0,
  avgBlocksPerDay: 1000,
  startingBlock: 1,
  get otc() { return load(otc, '0x4e5f802405b29ffae4ae2a7da1d9ceeb53904d55'); },
  get saiTub() { return { address: '', contract: null }; },
  get tokens() {
    return asMap('token', [
      loadToken('WETH', eth, '0x28085cefa9103d3a55fb5afccf07ed2038d31cd4'),
      loadToken('DAI', erc20, '0xff500c51399a282f4563f2713ffcbe9e53cfb6fa'),
    ]);
  },
  get otcSupportMethods() {
    return load(otcSupport, '0x5de139dbbfd47dd1d2cd906348fd1887135b2804');
  },
  oasisDataService: {
    url: 'http://localhost:4000/v1'
  },
  etherscan: {
    url: 'https://kovan.etherscan.io',
  },
};

export const networks = asMap('id', [main, kovan, localnet]);
