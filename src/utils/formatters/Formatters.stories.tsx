import { storiesOf } from '@storybook/react';
import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { formatAmount } from './format';
import { FormatAmount, Money } from './Formatters';

const stories = storiesOf('Text utils', module);

const SampleRow = ({ value, token }: {
  value: number,
  token: string
}) => (
  <tr>
    <td style={{ padding: '2px 10px', textAlign: 'right' }}>{value} {token}</td>
    <td style={{ padding: '2px 10px', textAlign: 'right' }}>
      {formatAmount(new BigNumber(value), token)}
    </td>
    <td style={{ padding: '2px 10px', textAlign: 'right' }}>
      <FormatAmount value={new BigNumber(value)} token={token} />
    </td>
    <td style={{ padding: '2px 10px', textAlign: 'right' }}>
      <FormatAmount value={new BigNumber(value)} token={token} greyedNonSignZeros={true} />
    </td>
    <td style={{ padding: '2px 10px', textAlign: 'right' }}>
      <Money value={new BigNumber(value)} token={token} />
    </td>
    <td style={{ padding: '2px 10px', textAlign: 'right' }}>
      <Money value={new BigNumber(value)} token={token} greyedNonSignZeros={true} />
    </td>
  </tr>
);

stories.add('Number formatter', () => (
  <table>
    <thead>
      <tr>
        <th style={{ fontSize: 'smaller', color: '#aaa', padding: '0 10px', textAlign: 'right' }}>
          Original value</th>
        <th style={{ fontSize: 'smaller', color: '#aaa', padding: '0 10px', textAlign: 'right' }}>
          formatAmount()</th>
        <th style={{ fontSize: 'smaller', color: '#aaa', padding: '0 10px', textAlign: 'right' }}>
          FormatAmount component</th>
        <th style={{ fontSize: 'smaller', color: '#aaa', padding: '0 10px', textAlign: 'right' }}>
          FormatAmount<br/>greyedNonSignZeros=true</th>
        <th style={{ fontSize: 'smaller', color: '#aaa', padding: '0 10px', textAlign: 'right' }}>
          Money component</th>
        <th style={{ fontSize: 'smaller', color: '#aaa', padding: '0 10px', textAlign: 'right' }}>
          Money component<br/>greyedNonSignZeros=true</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colSpan={3} style={{ color: '#aaa' }}> DAI</td>
      </tr>
      <SampleRow value={-500} token="DAI"/>
      <SampleRow value={0} token="DAI"/>
      <SampleRow value={50} token="DAI"/>
      <SampleRow value={0.005} token="DAI"/>
      <SampleRow value={123.54789654} token="DAI"/>
      <SampleRow value={1235} token="DAI"/>
      <SampleRow value={987654321} token="DAI"/>
      <tr>
        <td colSpan={3} style={{ color: '#aaa' }}> ETH</td>
      </tr>
      <SampleRow value={-500} token="ETH"/>
      <SampleRow value={0} token="ETH"/>
      <SampleRow value={50} token="ETH"/>
      <SampleRow value={0.005} token="ETH"/>
      <SampleRow value={123.54789654} token="ETH"/>
      <SampleRow value={1235} token="ETH"/>
      <SampleRow value={987654321} token="ETH"/>
    </tbody>
  </table>
));
