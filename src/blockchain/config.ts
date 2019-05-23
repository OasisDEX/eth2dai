import { fromPairs, memoize, zip } from 'lodash';

import { TradingPair } from '../exchange/tradingPair/tradingPair';
import daiCircleSvg from '../icons/coins/dai-circle.svg';
import daiColorSvg from '../icons/coins/dai-color.svg';
import daiInverseSvg from '../icons/coins/dai-inverse.svg';
import daiSvg from '../icons/coins/dai.svg';
import ethCircleSvg from '../icons/coins/eth-circle.svg';
import ethColorInverseSvg from '../icons/coins/eth-color-inverse.svg';
import ethColorSvg from '../icons/coins/eth-color.svg';
import ethInverseSvg from '../icons/coins/eth-inverse.svg';
import ethSvg from '../icons/coins/eth.svg';
import { SvgImageSimple } from '../utils/icons/utils';
import * as eth from './abi/ds-eth-token.abi.json';
import * as dsProxyFactory from './abi/ds-proxy-factory.abi.json';
import * as erc20 from './abi/erc20.abi.json';
import * as otc from './abi/matching-market.abi.json';
import * as otcSupport from './abi/otc-support-methods.abi.json';
import * as proxyCreationAndExecute from './abi/proxy-creation-and-execute.abi.json';
import * as proxyRegistry from './abi/proxy-registry.abi.json';
import * as saiTub from './abi/sai-tub.abi.json';
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
    digitsInstant: 3,
    maxSell: '10000000',
    name: 'Ether',
    icon: SvgImageSimple(ethSvg),
    iconInverse: SvgImageSimple(ethInverseSvg),
    iconCircle: SvgImageSimple(ethCircleSvg),
    iconColor: SvgImageSimple(ethColorSvg),
  },
  {
    symbol: 'WETH',
    precision: 18,
    digits: 5,
    digitsInstant: 3,
    maxSell: '10000000',
    name: 'Wrapped Ether',
    icon: SvgImageSimple(ethSvg),
    iconInverse: SvgImageSimple(ethCircleSvg),
    iconCircle: SvgImageSimple(ethInverseSvg),
    iconColor: SvgImageSimple(ethColorInverseSvg),
  },
  {
    symbol: 'DAI',
    precision: 18,
    digits: 2,
    digitsInstant: 2,
    maxSell: '10000000',
    name: 'Dai',
    icon: SvgImageSimple(daiSvg),
    iconInverse: SvgImageSimple(daiInverseSvg),
    iconCircle: SvgImageSimple(daiCircleSvg),
    iconColor: SvgImageSimple(daiColorSvg),
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
  get otc() { return load(otc, '0x39755357759ce0d7f32dc8dc45414cca409ae24e'); },
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
  get instantProxyRegistry() {
    return load(proxyRegistry, '0x4678f0a6958e4d2bc4f1baf7bc52e8f3564f3fe4');
  },
  get instantProxyFactory() {
    return load(dsProxyFactory, '0xa26e15c895efc0616177b7c1e7270a4c7d51c997');
  },
  get instantProxyCreationAndExecute() {
    return load(proxyCreationAndExecute, '0x793ebbe21607e4f04788f89c7a9b97320773ec59');
  },
  oasisDataService: {
    url: 'http://localhost:3001/v1'
  },
  etherscan: {
    url: 'https://etherscan.io',
    apiUrl: 'http://api.etherscan.io/api',
    apiKey: '34JVYM6RPM3J1SK8QXQFRNSHD9XG4UHXVU',
  },
  taxProxyRegistries: ['0xaa63c8683647ef91b3fdab4b4989ee9588da297b']
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
  get otc() { return load(otc, '0x4a6bc4e803c62081ffebcc8d227b5a87a58f1f8f'); },
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
  get instantProxyRegistry() {
    return load(proxyRegistry, '0x64a436ae831c1672ae81f674cab8b6775df3475c');
  },
  get instantProxyFactory() {
    return load(dsProxyFactory, '0xe11e3b391f7e8bc47247866af32af67dd58dc800');
  },
  get instantProxyCreationAndExecute() {
    return load(proxyCreationAndExecute, '0xee419971e63734fed782cfe49110b1544ae8a773');
  },
  oasisDataService: {
    url: 'http://localhost:3001/v1'
  },
  etherscan: {
    url: 'https://kovan.etherscan.io',
    apiUrl: 'http://api-kovan.etherscan.io/api',
    apiKey: '34JVYM6RPM3J1SK8QXQFRNSHD9XG4UHXVU',
  },
  taxProxyRegistries: ['0x64a436ae831c1672ae81f674cab8b6775df3475c']
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
  get instantProxyRegistry() {
    return load(proxyRegistry, '0xA155A86E426CB136334F6B6B6DD2633B73fc0183');
  },
  get instantProxyFactory() {
    return load(dsProxyFactory, '0xCb84a6D7A6b708a5a32c33a03F435D3e10C3d7Ad');
  },
  get instantProxyCreationAndExecute() {
    return load(proxyCreationAndExecute, '0x99C7F543e310A4143D22ce840a348b4EcDbBA8Ce');
  },
  oasisDataService: {
    url: 'http://localhost:3001/v1'
  },
  etherscan: {
    url: 'https://kovan.etherscan.io',
    apiUrl: 'http://api-kovan.etherscan.io/api',
    apiKey: '34JVYM6RPM3J1SK8QXQFRNSHD9XG4UHXVU',
  },
  taxProxyRegistries: []
};

export const networks = asMap('id', [main, kovan, localnet]);
