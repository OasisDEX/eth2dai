import { storiesOf } from '@storybook/react';
import * as React from 'react';
import { Slider } from './Slider';

const stories = storiesOf('Form inputs and buttons', module);

stories.add('Slider', () => (
  <div>
    <h3>Default</h3>
    <Slider blocked={false}/> <Slider blocked={true}/>
    <h3>With moveOnHover</h3>
    <Slider blocked={false} moveOnHover={true}/> <Slider blocked={true} moveOnHover={true}/>
    <h3>Disabled</h3>
    <Slider blocked={false} moveOnHover={true}
            disabled={true}/> <Slider blocked={true} moveOnHover={true}
                                      disabled={true}/>
    <h3>Default in progress</h3>
    <Slider blocked={false} inProgress={true}/> <Slider blocked={true} inProgress={true}/>
  </div>
));
