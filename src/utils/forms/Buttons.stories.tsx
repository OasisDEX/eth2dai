import { storiesOf } from '@storybook/react';
import * as React from 'react';
import { Button, ButtonGroup } from './Buttons';

const stories = storiesOf('Form inputs and buttons/Buttons', module);

stories.add('Colors', () => (
  <div>
    <h3>Default (grey) button</h3>
    <Button>Default enabled button</Button>
    <br/>
    <Button disabled={true}>Default disabled button</Button>

    <h3>Green button</h3>
    <Button color="green">Green enabled button</Button>
    <br/>
    <Button color="green" disabled={true}>Green disabled button</Button>

    <h3>Red button</h3>
    <Button color="red">Red enabled button</Button>
    <br/>
    <Button color="red" disabled={true}>Red disabled button</Button>

    <h3>White button</h3>
    <Button color="white">White enabled button</Button>
    <br/>
    <Button color="white" disabled={true}>White disabled button</Button>

    <h3>Grey white button</h3>
    <Button color="greyWhite">Grey white enabled button</Button>
    <br/>
    <Button color="greyWhite" disabled={true}>Grey white disabled button</Button>

    <h3>White outlined button</h3>
    <Button color="whiteOutlined">White outlined enabled button</Button>
    <br/>
    <Button color="whiteOutlined" disabled={true}>White outlined disabled button</Button>
  </div>
));

stories.add('Button group', () => (
  <div>
    <ButtonGroup>
      <Button color="red">Pierwszy</Button>
      <Button color="green">Drugi</Button>
      <Button color="red">Trzeci</Button>
    </ButtonGroup>
    <br/>
    <ButtonGroup>
      <Button color="grey">Nick Burkhardt</Button>
      <Button color="grey">Juliette Silverton</Button>
      <Button color="grey">Eddie Monroe</Button>
      <Button color="grey">Rosalee Calvert</Button>
      <Button color="grey">Hank Griffin</Button>
    </ButtonGroup>
  </div>
));

stories.add('Button size', () => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-end',
  }}>
    <Button>Nosize</Button>
    <Button size="xs">Extra small (size="xs")</Button>
    <Button size="sm">Small (size="sm")</Button>
    <Button size="md">Medium (size="md")</Button>
    <Button size="lg">Medium (size="lg")</Button>
  </div>
));

stories.add('Button block', () => (
  <table>
    <thead>
    <tr>
      <td style={{ width: '150px' }}>
        <Button block={true}>block=true</Button>
      </td>
      <td style={{ width: '550px' }}>
        <Button block={true}>Block2</Button>
      </td>
    </tr>
    <tr>
      <td colSpan={2}>
        <Button block={true}>Block 3</Button>
      </td>
    </tr>
    </thead>
  </table>
));
