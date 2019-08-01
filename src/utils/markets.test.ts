import { marketsOf } from './markets';

test('should return all possible markets for a given token', () => {
  const pairs = [
    { base: 'WETH', quote: 'MKR' },
    { base: 'MKR', quote: 'DAI' },
    { base: 'MKR', quote: 'USDC' },
    { base: 'WETH', quote: 'USDC' },
    { base: 'WETH', quote: 'WBTC' },
  ];

  const availableMarkets = new Set<string>(['WETH', 'DAI', 'USDC']);

  expect(marketsOf('MKR', pairs)).toEqual(availableMarkets);
});

test('should return empty set if no markets are found for the given token', () => {
  const pairs = [
    { base: 'WETH', quote: 'MKR' },
    { base: 'MKR', quote: 'DAI' },
    { base: 'MKR', quote: 'USDC' },
    { base: 'WETH', quote: 'USDC' },
    { base: 'WETH', quote: 'WBTC' },
  ];

  const availableMarkets = new Set<string>([]);

  expect(marketsOf('DGD', pairs)).toEqual(availableMarkets);
});

test('should return empty set if no markets are available at all', () => {
  const availableMarkets = new Set<string>([]);

  expect(marketsOf('DGD', [])).toEqual(availableMarkets);
});

test('should include ETH token as WETH', () => {
  const pairs = [
    { base: 'ETH', quote: 'MKR' },
    { base: 'MKR', quote: 'DAI' },
  ];

  const availableMarkets = new Set<string>(['WETH', 'DAI']);

  expect(marketsOf('MKR', pairs)).toEqual(availableMarkets);
});
