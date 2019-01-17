import { storiesOf } from '@storybook/react';
import * as React from 'react';

import { Table } from '../table/Table';
import { Panel, PanelBody, PanelHeader } from './Panel';

const stories = storiesOf('Panel', module);

stories.add('Panel', () => (
  <div>
    <h3>Simple panel and panel body</h3>
    <Panel style={{ width: '750px' }}>
      <PanelHeader>Panel header</PanelHeader>
      <PanelBody>
        Panel body. By default has set panelHorizontal, you may add also:
        <ul>
          <li>scrollable - boolean; you must set height</li>
          <li>paddingBottom, paddingTop, paddingVertical</li>
        </ul>
      </PanelBody>
    </Panel>

    <h3>Panel with table - do not ue panel body</h3>
    <Panel  style={{ width: '750px' }}>
      <PanelHeader>Panel header </PanelHeader>
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
          <tr>
            <td>Rukia Kuchiki</td>
            <td>A</td>
            <td>144 cm</td>
            <td>33 kg</td>
            <td>Capricorn</td>
            <td>January 14</td>
            <td>Garnet</td>
          </tr>
          <tr>
            <td>Toshiro Hitsugaya</td>
            <td>0</td>
            <td>133 cm</td>
            <td>28 kg</td>
            <td>Sagittarius</td>
            <td>December 20</td>
            <td>Turquoise</td>
          </tr>
          <tr>
            <td>Shinji Ikari</td>
            <td>A</td>
            <td>138 cm</td>
            <td>45 kg</td>
            <td>Gemini</td>
            <td>June 6</td>
            <td>Agate</td>
          </tr>
        </tbody>
      </Table>
    </Panel>

    <h3>Panel bordered</h3>
    <Panel style={{ width: '750px' }} footerBordered={true}>
      <PanelHeader bordered={true}>Panel header bordered</PanelHeader>
      <PanelBody>
        <p>This is very bordered panel</p>
        <p>Panel has footerBordered=true, it makes those footer line at the bottom</p>
        <p>Panel header has bordered=true, so it has border under the header</p>
      </PanelBody>
    </Panel>

    <h3>Panel body with padding</h3>
    <Panel style={{ width: '750px' }} footerBordered={true}>
      <PanelHeader bordered={true}>Panel header bordered</PanelHeader>
      <PanelBody paddingVertical={true}>
        <span>It is span, it has no spaces by itself. Panel body has paddingVertical=true</span>
      </PanelBody>
    </Panel>
  </div>
));
