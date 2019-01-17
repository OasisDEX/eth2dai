import { storiesOf } from '@storybook/react';
import * as React from 'react';
import { Radio } from './Radio';

const stories = storiesOf('Form inputs and buttons', module);

stories.add('Radio', () => (
  <div>
    <Radio
       name="sampleName"
       value="a">
      Label for radio button
    </Radio>
    <Radio
       name="sampleName"
       value="b"
    >
      Label b
    </Radio>
    <Radio
      name="sampleName"
      value="c"
      defaultChecked={true}
    >
      Label checked
    </Radio>
    <Radio
      name="sampleName"
      value="d"
      disabled={true}
    >
      Label disabled
    </Radio>
    <Radio
      name="sampleName"
      value="e"
    >
      Label e
    </Radio>
  </div>
));
