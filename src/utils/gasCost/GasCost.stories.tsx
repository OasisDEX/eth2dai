import { storiesOf } from '@storybook/react';
import { BigNumber } from 'bignumber.js';
import * as React from 'react';

import { GasEstimationStatus } from '../form';
import { GasCost } from './GasCost';

const stories = storiesOf('Form inputs and buttons/Gas price', module);

const thStyle = { fontSize: 'smaller', color: '#aaa', padding: '0 10px' };
const tdStyle = { padding: '5px 15px' };

stories.add('Gas cost states', () => (
  <div>
    <table>
      <thead>
        <tr>
          <th style={ thStyle }>
            Gas estimation status</th>
          <th style={ thStyle }>
            GasCost</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={ tdStyle }>unset</td>
          <td style={ tdStyle }><GasCost gasEstimationStatus={GasEstimationStatus.unset}/></td>
        </tr>
        <tr>
          <td style={ tdStyle }>calculating</td>
          <td style={ tdStyle }><GasCost gasEstimationStatus={GasEstimationStatus.calculating}/>
          </td>
        </tr>
        <tr>
          <td style={ tdStyle }>calculated</td>
          <td style={ tdStyle }><GasCost gasEstimationStatus={GasEstimationStatus.calculated}
             gasEstimationUsd={new BigNumber(23.12)}
             gasEstimationEth={new BigNumber(3.24)}
            />
          </td>
        </tr>
        <tr>
          <td style={ tdStyle }>calculated w/o values</td>
          <td style={ tdStyle }>
            <GasCost gasEstimationStatus={GasEstimationStatus.calculated}/></td>
        </tr>
          <tr>
            <td style={ tdStyle }>error</td>
            <td style={ tdStyle }><GasCost gasEstimationStatus={GasEstimationStatus.error}/>
            </td>
          </tr>
      </tbody>
    </table>
  </div>
));
