import { BigNumber } from 'bignumber.js';
import { formatPrice } from './formatters/format';

export const calculateTradePrice = (sellToken: string, sellAmount: BigNumber, buyToken: string, buyAmount: BigNumber) => {
  return (sellToken.toLowerCase() === 'dai' || (sellToken.toLowerCase() === 'eth' && buyToken.toLowerCase() !== 'dai'))
    ?
    { price: new BigNumber(formatPrice(sellAmount.div(buyAmount), sellToken)), quotation: `${buyToken}/${sellToken}` }
    :
    { price: new BigNumber(formatPrice(buyAmount.div(sellAmount), buyToken)), quotation: `${sellToken}/${buyToken}` };
};

export const getQuote = (sellToken: string, buyToken: string) => {
  return (sellToken.toLowerCase() === 'dai' || (sellToken.toLowerCase() === 'eth' && buyToken.toLowerCase() !== 'dai'))
    ? `${buyToken}/${sellToken}`
    : `${sellToken}/${buyToken}`;
};
