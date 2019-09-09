import { fromPairs, memoize, zip } from 'lodash';

import { TradingPair } from '../exchange/tradingPair/tradingPair';
import batCircleSvg from '../icons/coins/bat-circle.svg';
import batColorSvg from '../icons/coins/bat-color.svg';
import batSvg from '../icons/coins/bat.svg';
import daiCircleSvg from '../icons/coins/dai-circle.svg';
import daiColorSvg from '../icons/coins/dai-color.svg';
// import daiInverseSvg from '../icons/coins/dai-inverse.svg';
import daiSvg from '../icons/coins/dai.svg';
import dgdCircleSvg from '../icons/coins/dgd-circle.svg';
import dgdColorSvg from '../icons/coins/dgd-color.svg';
import dgdSvg from '../icons/coins/dgd.svg';
import ethCircleSvg from '../icons/coins/eth-circle.svg';
// import ethColorInverseSvg from '../icons/coins/eth-color-inverse.svg';
import ethColorSvg from '../icons/coins/eth-color.svg';
// import ethInverseSvg from '../icons/coins/eth-inverse.svg';
import ethSvg from '../icons/coins/eth.svg';
// import mkrInverseSvg from '../icons/coins/mkr-inverse.svg';
// import mkrSvg from '../icons/coins/mkr.svg';
import repCircleSvg from '../icons/coins/rep-circle.svg';
import repColorSvg from '../icons/coins/rep-color.svg';
import repSvg from '../icons/coins/rep.svg';
// import usdcCircleSvg from '../icons/coins/usdc-circle.svg';
// import usdcColorSvg from '../icons/coins/usdc-color.svg';
// import usdcSvg from '../icons/coins/usdc.svg';
// import wbtcCircleSvg from '../icons/coins/wbtc-circle.svg';
// import wbtcColorSvg from '../icons/coins/wbtc-color.svg';
// import wbtcSvg from '../icons/coins/wbtc.svg';
import zrxCircleSvg from '../icons/coins/zrx-circle.svg';
import zrxColorSvg from '../icons/coins/zrx-color.svg';
import zrxSvg from '../icons/coins/zrx.svg';

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
  ...process.env.REACT_APP_OASIS_DEX_ENABLED !== '1' ? [] : [
    // { base: 'MKR', quote: 'DAI' },
    // { base: 'MKR', quote: 'WETH' },
    { base: 'DGD', quote: 'DAI' },
    { base: 'REP', quote: 'DAI' },
    { base: 'ZRX', quote: 'DAI' },
    { base: 'BAT', quote: 'DAI' }
  ]
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
    // iconInverse: SvgImageSimple(ethInverseSvg),
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
    // iconInverse: SvgImageSimple(ethCircleSvg),
    iconCircle: SvgImageSimple(ethCircleSvg),
    iconColor: SvgImageSimple(ethCircleSvg),
  },
  {
    symbol: 'DAI',
    precision: 18,
    digits: 2,
    digitsInstant: 2,
    maxSell: '10000000',
    name: 'Dai',
    icon: SvgImageSimple(daiSvg),
    // iconInverse: SvgImageSimple(daiInverseSvg),
    iconCircle: SvgImageSimple(daiCircleSvg),
    iconColor: SvgImageSimple(daiColorSvg),
  },
  ...process.env.REACT_APP_OASIS_DEX_ENABLED !== '1' ? [] : [
    // {
    //   symbol: 'MKR',
    //   precision: 18,
    //   digits: 5,
    //   digitsInstant: 3,
    //   maxSell: '10000000',
    //   name: 'Maker',
    //   icon: SvgImageSimple(mkrSvg),
    //   iconCircle: SvgImageSimple(mkrInverseSvg),
    //   iconColor: SvgImageSimple(mkrInverseSvg),
    // },
    // {
    //   symbol: 'DGX',
    //   precision: 18,
    //   digits: 5,
    //   digitsInstant: 3,
    //   safeCollRatio: 1.5,
    //   maxSell: '1000000000000000',
    //   name: 'Digix',
    //   icon: SvgImageSimple(dgdSvg),
    //   // iconInverse: SvgImageSimple(mkrInverseSvg),
    //   iconCircle: SvgImageSimple(dgdCircleSvg),
    //   iconColor: SvgImageSimple(dgdColorSvg),
    // },
    {
      symbol: 'DGD',
      precision: 9,
      digits: 5,
      digitsInstant: 3,
      safeCollRatio: 1.5,
      maxSell: '1000000000000000',
      name: 'DigixDAO',
      icon: SvgImageSimple(dgdSvg),
    // iconInverse: SvgImageSimple(dgdInverseSvg),
      iconCircle: SvgImageSimple(dgdCircleSvg),
      iconColor: SvgImageSimple(dgdColorSvg),
    },
    {
      symbol: 'REP',
      precision: 18,
      digits: 5,
      digitsInstant: 3,
      safeCollRatio: 1.5,
      maxSell: '1000000000000000',
      name: 'Augur',
      icon: SvgImageSimple(repSvg),
    // iconInverse: SvgImageSimple(repInverseSvg),
      iconCircle: SvgImageSimple(repCircleSvg),
      iconColor: SvgImageSimple(repColorSvg),
    },
    {
      symbol: 'ZRX',
      precision: 18,
      digits: 5,
      digitsInstant: 3,
      safeCollRatio: 1.5,
      maxSell: '1000000000000000',
      name: '0x',
      icon: SvgImageSimple(zrxSvg),
    // iconInverse: SvgImageSimple(mkrInverseSvg),
      iconCircle: SvgImageSimple(zrxCircleSvg),
      iconColor: SvgImageSimple(zrxColorSvg),
    },
    {
      symbol: 'BAT',
      precision: 18,
      digits: 5,
      digitsInstant: 3,
      safeCollRatio: 1.5,
      maxSell: '1000000000000000',
      name: 'Basic Attention Token',
      icon: SvgImageSimple(batSvg),
    // iconInverse: SvgImageSimple(batInverseSvg),
      iconCircle: SvgImageSimple(batCircleSvg),
      iconColor: SvgImageSimple(batColorSvg),
    },
  // {
  //   symbol: 'USDC',
  //   precision: 6,
  //   digits: 5,
  //   digitsInstant: 2,
  //   safeCollRatio: 1.5,
  //   maxSell: '1000000000000000',
  //   name: 'USD Coin',
  //   icon: SvgImageSimple(usdcSvg),
  //   // iconInverse: SvgImageSimple(usdcInverseSvg),
  //   iconCircle: SvgImageSimple(usdcCircleSvg),
  //   iconColor: SvgImageSimple(usdcColorSvg),
  //   // address: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
  // },
  // {
  //   symbol: 'WBTC',
  //   precision: 8,
  //   digits: 5,
  //   digitsInstant: 3,
  //   safeCollRatio: 1.5,
  //   maxSell: '1000000000000000',
  //   name: 'Wrapped Bitcoin',
  //   icon: SvgImageSimple(wbtcSvg),
  //   // iconInverse: SvgImageSimple(wbtcInverseSvg),
  //   iconCircle: SvgImageSimple(wbtcCircleSvg),
  //   iconColor: SvgImageSimple(wbtcColorSvg),
  //   // address: 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599
  // }
  ]]);

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
  thresholds: {
    ethdai: 0.02,
    mkrdai: 0.01,
    mkreth: 0.01,
    dgddai: 0.02,
    repdai: 0.02,
    zrxdai: 0.02,
    batdai: 0.02,
  },
  safeConfirmations: 0,
  avgBlocksPerDay: 5760 * 1.05,
  startingBlock: 4751582,
  get otc() { return load(otc, '0x39755357759ce0d7f32dc8dc45414cca409ae24e'); },
  get saiTub() { return load(saiTub, '0x448a5065aebb8e423f0896e6c5d525c040f59af3'); },
  get tokens() {
    return asMap('token', [
      loadToken('WETH', eth, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
      loadToken('DAI', erc20, '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'),
      loadToken('MKR', erc20, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'),
      loadToken('DGD', erc20, '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a'),
      loadToken('REP', erc20, '0x1985365e9f78359a9B6AD760e32412f4a445E862'),
      loadToken('ZRX', erc20, '0xe41d2489571d322189246dafa5ebde1f4699f498'),
      loadToken('BAT', erc20, '0x0d8775f648430679a709e98d2b0cb6250d2887ef'),
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
    url: 'https://cache.eth2dai.com/api/v1'
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
  thresholds: {
    ethdai: 0.025,
    mkrdai: 0.015,
    mkreth: 0.015,
    dgddai: 0.025,
    repdai: 0.025,
    zrxdai: 0.025,
    batdai: 0.025,
  },
  safeConfirmations: 0,
  avgBlocksPerDay: 21600 * 0.55,
  startingBlock: 5216718,
  get otc() { return load(otc, '0x4a6bc4e803c62081ffebcc8d227b5a87a58f1f8f'); },
  get saiTub() { return load(saiTub, '0xa71937147b55deb8a530c7229c442fd3f31b7db2'); },
  get tokens() {
    return asMap('token', [
      loadToken('WETH', eth, '0xd0a1e359811322d97991e03f863a0c30c2cf029c'),
      loadToken('DAI', erc20, '0xc4375b7de8af5a38a93548eb8453a498222c4ff2'),
      loadToken('MKR', erc20, '0xaaf64bfcc32d0f15873a02163e7e500671a4ffcd'),
      loadToken('DGD', erc20, '0x62aeec5fb140bb233b1c5612a8747ca1dc56dc1b'),
      loadToken('REP', erc20, '0xc7aa227823789e363f29679f23f7e8f6d9904a9b'),
      loadToken('ZRX', erc20, '0x18392097549390502069c17700d21403ea3c721a'),
      loadToken('BAT', erc20, '0x9f8cfb61d3b2af62864408dd703f9c3beb55dff7'),
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
    url: 'https://kovan-cache.eth2dai.com/api/v1'
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
  thresholds: {
    ethdai: 0.05,
    mkrdai: 0.05,
    mkreth: 0.05,
    dgddai: 0.05,
    repdai: 0.05,
    zrxdai: 0.05,
    batdai: 0.05,
  },
  safeConfirmations: 0,
  avgBlocksPerDay: 1000,
  startingBlock: 1,
  get otc() { return load(otc, '0x4e5f802405b29ffae4ae2a7da1d9ceeb53904d55'); },
  get saiTub() { return { address: '', contract: null }; },
  get tokens() {
    return asMap('token', [
      loadToken('WETH', eth, '0x28085cefa9103d3a55fb5afccf07ed2038d31cd4'),
      loadToken('DAI', erc20, '0xff500c51399a282f4563f2713ffcbe9e53cfb6fa'),
      loadToken('MKR', erc20, '0xe80C262f63df9376d2ce9eDd373832EDc9FCA46E'),
      loadToken('DGD', erc20, '0x7BBABcB1dA23089f6b20502D78B02C5A5cf39861'),
      loadToken('ZRX', erc20, '0x2f42E9A9BA1A8BfE0a46a7b116aD5b0D16d2B105'),
      loadToken('BAT', erc20, '0x30ed29c4C4bA30ECCcDd0c0D153E454BFCb0A4Dd'),
      loadToken('REP', erc20, '0xE2ecCEEc6dEB8c7AFF9787E46FEA7078b89ab159'),
    ]);
  },
  get otcSupportMethods() {
    return load(otcSupport, '0x5de139dbbfd47dd1d2cd906348fd1887135b2804');
  },
  get instantProxyRegistry() {
    return load(proxyRegistry, '0x947308140e877E8EeBcCED93B522407A24278c6A');
  },
  get instantProxyFactory() {
    return load(dsProxyFactory, '0xb45C4e325a3264a2D25E0A36f5B8431aF584A23D');
  },
  get instantProxyCreationAndExecute() {
    return load(proxyCreationAndExecute, '0x2aD8bbFBA09e2fe0a5394E6B4709323EeDbbFD19');
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
