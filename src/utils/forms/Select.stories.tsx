import { storiesOf } from '@storybook/react';
import * as React from 'react';
import { Select } from './Select';

const stories = storiesOf('Form inputs and buttons/Select', module);

stories.add('Default select', () => (
  <div>
    <h4>Default select without set width</h4>
    <Select>
      <option>Default first option</option>
      <option>Default second option</option>
    </Select>
    <h4>Default select with set width</h4>
    <Select style={{ width: '300px' }}>
      <option>Width set first option</option>
      <option>Width second option</option>
    </Select>
  </div>
));

stories.add('Bordered select', () => (
  <div>
    <h4>Bordered select without set width</h4>
    <Select bordered={true}>
      <option>Default first option</option>
      <option>Default second option</option>
    </Select>
    <h4>Bordered select with set width</h4>
    <Select bordered={true} style={{ width: '300px' }}>
      <option>Width set first option</option>
      <option>Width second option</option>
    </Select>
  </div>
));

stories.add('Disabled select', () => (
  <div>
    <h4>Default disabled</h4>
    <Select style={{ width: '300px' }} disabled={true}>
      <option>Width set first option</option>
      <option>Width second option</option>
    </Select>
    <h4>Bordered disabled</h4>
    <Select bordered={true} style={{ width: '300px' }} disabled={true}>
      <option>Width set first option</option>
      <option>Width second option</option>
    </Select>
  </div>
));

stories.add('Sizes of select', () => (
  <div>
    <h4>Default (unset or "unsized")</h4>
    <Select bordered={true} style={{ width: '300px' }}>
      <option>Default first option</option>
      <option>Default second option</option>
    </Select>
    <Select sizer="unsized" bordered={true} style={{ width: '300px' }}>
      <option>Default first option</option>
      <option>Default second option</option>
    </Select>
    <h4>Size sm</h4>
    <Select sizer="sm" bordered={true} style={{ width: '300px' }}>
      <option>Width set first option</option>
      <option>Width second option</option>
    </Select>
    <h4>Size md</h4>
    <Select sizer="md" bordered={true} style={{ width: '300px' }}>
      <option>Width set first option</option>
      <option>Width second option</option>
    </Select>
    <h4>Size lg</h4>
    <Select sizer="lg" bordered={true} style={{ width: '300px' }}>
      <option>Width set first option</option>
      <option>Width second option</option>
    </Select>
  </div>
));
