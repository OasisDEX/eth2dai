import { storiesOf } from '@storybook/react';
import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { BoundarySpan, GreenSpan, InfoLabel, Muted, RedSpan, SellBuySpan } from './Text';

const stories = storiesOf('Text utils', module);

stories.add('Text span helpers', () => {
  return (
    <table>
      <thead>
      <tr>
        <th style={{ width: '250px' }}>Kind</th>
        <th>Sample</th>
      </tr>
      </thead>
      <tbody>
        <tr>
          <td>default</td>
          <td>Sample text</td>
        </tr>
        <tr>
          <td>InfoLabel</td>
          <td><InfoLabel>Sample text</InfoLabel></td>
        </tr>
        <tr>
          <td>Muted</td>
          <td><Muted>Sample text</Muted></td>
        </tr>
        <tr>
          <td>RedSpan</td>
          <td>
            <RedSpan>Sample text</RedSpan>
          </td>
        </tr>
        <tr>
          <td>GreenSpan</td>
          <td><GreenSpan>Sample text</GreenSpan></td>
        </tr>
        <tr>
          <td>SellBuySpan type: sell</td>
          <td><SellBuySpan type="sell">Sample text</SellBuySpan></td>
        </tr>
        <tr>
          <td>SellBuySpan type: buy</td>
          <td><SellBuySpan type="buy">Sample text</SellBuySpan></td>
        </tr>
        <tr>
          <td>SellBuySpan type: default</td>
          <td><SellBuySpan type="">Sample text</SellBuySpan></td>
        </tr>
      </tbody>
    </table>
  );
});

const BoundaryRow = ({ value, middleValue, middleValueAs }: {
  value: number,
  middleValue?: number,
  middleValueAs?: 'greater' | 'lower' | 'neutral',
}) => (
  <tr>
    <td style={{ padding: '0.25em 1em', textAlign: 'right' }}>{value}</td>
    <td style={{ padding: '0.25em 1em', textAlign: 'right' }}>{middleValue}</td>
    <td style={{ padding: '0.25em 1em' }}>{middleValueAs}</td>
    <td style={{ padding: '0.25em 1em' }}>
      <BoundarySpan
        value={new BigNumber(value)}
        middleAs={middleValueAs}
        middleValue={middleValue ? new BigNumber(middleValue) : undefined}
      >
        Sample text
      </BoundarySpan>
    </td>
  </tr>
);
stories.add('Boundary span', () => {
  return (
    <div>
      <p>Colored span - red if value is smaller than middleValue, green if is greater</p>
      <p>Params:
        <ul>
          <li>value - BigNumber, required;</li>
          <li>middleValue - BigNumber, optional; by default zero is middle value</li>
          <li>middleAs - optional; by default 'neutral' - it determines color for middle value;
            possible values:
            <ul>
              <li>neutral - middle value will be with default color</li>
              <li>greater - treat as greater values</li>
              <li>lower - treat as lower values</li>
            </ul>
            </li>
        </ul>
      </p>
      <table>
        <thead>
          <tr>
            <th style={{ padding: '0.5em 1em' }}>value</th>
            <th style={{ padding: '0.5em 1em' }}>middleValue</th>
            <th style={{ padding: '0.5em 1em' }}>middleAs</th>
            <th style={{ padding: '0.5em 1em' }}>Sample text</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={5}><InfoLabel>Default values</InfoLabel></td></tr>
          <BoundaryRow value={-3} />
          <BoundaryRow value={0} />
          <BoundaryRow value={3} />
          <tr><td colSpan={5}><InfoLabel>MiddleValue -2</InfoLabel></td></tr>
          <BoundaryRow middleValue={-2} value={-3} />
          <BoundaryRow middleValue={-2} value={0} />
          <BoundaryRow middleValue={-2} value={3} />
          <tr><td colSpan={5}><InfoLabel>MiddleValue 2</InfoLabel></td></tr>
          <BoundaryRow middleValue={2} value={-3} />
          <BoundaryRow middleValue={2} value={0} />
          <BoundaryRow middleValue={2} value={3} />
          <tr><td colSpan={5}><InfoLabel>Different middleAs</InfoLabel></td></tr>
          <BoundaryRow middleValueAs="greater" value={0} />
          <BoundaryRow middleValueAs="lower" value={0} />
          <BoundaryRow middleValueAs="neutral" value={0} />
        </tbody>
      </table>
    </div>
  );
});
