import { storiesOf } from '@storybook/react';
import * as React from 'react';
import { InfoIcon, ProgressIcon } from './Icons';

const stories = storiesOf('Icons', module);

stories.add('Icons', () => (
  <div>
    <h3>InfoIcon</h3>
    <InfoIcon/>
    <h3>ProgressIcon</h3>
    <ProgressIcon/>
    <h4>ProgressIcon Light</h4>
    <ProgressIcon light={true}/>
    <h4>ProgressIcon Small</h4>
    <ProgressIcon size="sm"/>
  </div>
));
