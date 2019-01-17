import { storiesOf } from '@storybook/react';
import * as React from 'react';

import { Panel, PanelHeader } from '../panel/Panel';
import { RowClickable, RowHighlighted, Table } from './Table';

const stories = storiesOf('Table', module);

stories.add('Table', () => (
    <Table>
      <thead>
        <tr>
          <th style={{ width: '30%' }}>Name</th>
          <th style={{ width: '10%' }}>Blood type</th>
          <th style={{ width: '20%' }}>Height</th>
          <th style={{ width: '20%' }}>Weight</th>
          <th style={{ width: '20%' }}>Zodiac</th>
          <th style={{ width: '25%' }}>Birthday</th>
          <th style={{ width: '20%' }}>Lucky stone</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Naruto Uzumaki</td>
          <td>B</td>
          <td>166 cm</td>
          <td>51 kg</td>
          <td>Libra</td>
          <td>October 10</td>
          <td>Opal</td>
        </tr>
        <tr>
          <td>Sakura Haruno</td>
          <td>0</td>
          <td>162 cm</td>
          <td>48 kg</td>
          <td>Aries</td>
          <td>March 28</td>
          <td>Diamond</td>
        </tr>
        <RowClickable clickable={true} highlighted={true}>
          <td colSpan={7}>
            Bleach series -- RowClickable and highlighted
          </td>
        </RowClickable>
        <tr>
          <td>Ichigo Kurosaki</td>
          <td>A</td>
          <td>174 cm</td>
          <td>61 kg</td>
          <td>Cancer</td>
          <td>July 15</td>
          <td>Pearl</td>
        </tr>
        <RowClickable clickable={true}>
          <td colSpan={7}>
            no series -- RowClickable
          </td>
        </RowClickable>
        <RowHighlighted>
          <td colSpan={7}>
            anything else -- RowHighlighted
          </td>
        </RowHighlighted>
      </tbody>
    </Table>
));

stories.add('Table in panel', () => (
  <Panel>
    <PanelHeader>Some table in panel</PanelHeader>
    <Table>
      <thead>
      <tr>
        <th style={{ width: '30%' }}>Name</th>
        <th style={{ width: '10%' }}>Blood type</th>
        <th style={{ width: '20%' }}>Height</th>
        <th style={{ width: '20%' }}>Weight</th>
        <th style={{ width: '20%' }}>Zodiac</th>
        <th style={{ width: '25%' }}>Birthday</th>
        <th style={{ width: '20%' }}>Lucky stone</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>Naruto Uzumaki</td>
        <td>B</td>
        <td>166 cm</td>
        <td>51 kg</td>
        <td>Libra</td>
        <td>October 10</td>
        <td>Opal</td>
      </tr>
      <tr>
        <td>Sakura Haruno</td>
        <td>0</td>
        <td>162 cm</td>
        <td>48 kg</td>
        <td>Aries</td>
        <td>March 28</td>
        <td>Diamond</td>
      </tr>
      <tr>
        <td>Ichigo Kurosaki</td>
        <td>A</td>
        <td>174 cm</td>
        <td>61 kg</td>
        <td>Cancer</td>
        <td>July 15</td>
        <td>Pearl</td>
      </tr>
      </tbody>
    </Table>
  </Panel>
));
