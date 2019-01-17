import { storiesOf } from '@storybook/react';
import * as React from 'react';
import { BigNumberInput } from '../bigNumberInput/BigNumberInput';
import { InputGroup, InputGroupAddon } from './InputGroup';

const stories = storiesOf('Form inputs and buttons/Input group', module);

stories.add('Input group', () => (
  <div>
    <h2>Single addon</h2>
    <h4>Input group without inner borders, with BigNumberInput</h4>
    <InputGroup style={{ width: '350px' }}>
      <InputGroupAddon>$</InputGroupAddon>
      <BigNumberInput />
    </InputGroup>
    <h4>Input group, addon with border right</h4>
    <InputGroup style={{ width: '350px' }}>
      <InputGroupAddon border="right">$</InputGroupAddon>
      <BigNumberInput />
    </InputGroup>
    <h2>Multiple addons </h2>
    <h4>Different border value: unset, right, left, both and none</h4>
    <InputGroup style={{ width: '350px' }}>
      <InputGroupAddon>Amount</InputGroupAddon>
      <BigNumberInput />
      <InputGroupAddon>$</InputGroupAddon>
      <InputGroupAddon>(USD)</InputGroupAddon>
    </InputGroup>
    <InputGroup style={{ width: '350px' }}>
      <InputGroupAddon>Amount</InputGroupAddon>
      <BigNumberInput />
      <InputGroupAddon border="right">$</InputGroupAddon>
      <InputGroupAddon>(USD)</InputGroupAddon>
    </InputGroup>
    <InputGroup style={{ width: '350px' }}>
      <InputGroupAddon>Amount</InputGroupAddon>
      <BigNumberInput />
      <InputGroupAddon border="left">$</InputGroupAddon>
      <InputGroupAddon>(USD)</InputGroupAddon>
    </InputGroup>
    <InputGroup style={{ width: '350px' }}>
      <InputGroupAddon>Amount</InputGroupAddon>
      <BigNumberInput />
      <InputGroupAddon border="both">$</InputGroupAddon>
      <InputGroupAddon>(USD)</InputGroupAddon>
    </InputGroup>
    <InputGroup style={{ width: '350px' }}>
      <InputGroupAddon>Amount</InputGroupAddon>
      <BigNumberInput />
      <InputGroupAddon border="none">$</InputGroupAddon>
      <InputGroupAddon>(USD)</InputGroupAddon>
    </InputGroup>
    <h2>Border colors</h2>
    <h4>Default - unset or "grey"</h4>
    <InputGroup color="grey" style={{ width: '350px' }}>
      <InputGroupAddon border="right">Amount</InputGroupAddon>
      <BigNumberInput />
      <InputGroupAddon border="both">$</InputGroupAddon>
      <InputGroupAddon>(USD)</InputGroupAddon>
    </InputGroup>
    <h4>Default - red</h4>
    <InputGroup color="red" style={{ width: '350px' }}>
      <InputGroupAddon border="right">Amount</InputGroupAddon>
      <BigNumberInput />
      <InputGroupAddon border="both">$</InputGroupAddon>
      <InputGroupAddon>(USD)</InputGroupAddon>
    </InputGroup>
    <h4>Default - disabled</h4>
    <InputGroup disabled={true} style={{ width: '350px' }}>
      <InputGroupAddon border="right">Amount</InputGroupAddon>
      <BigNumberInput />
      <InputGroupAddon border="both">$</InputGroupAddon>
      <InputGroupAddon>(USD)</InputGroupAddon>
    </InputGroup>
    <h2>Sizes</h2>
    <h4>Sm</h4>
    <InputGroup color="grey" style={{ width: '350px' }} sizer="sm">
      <InputGroupAddon border="right">Amount</InputGroupAddon>
      <BigNumberInput />
      <InputGroupAddon border="both">$</InputGroupAddon>
      <InputGroupAddon>(USD)</InputGroupAddon>
    </InputGroup>
    <h4>Md</h4>
    <InputGroup color="grey" style={{ width: '350px' }} sizer="md">
      <InputGroupAddon border="right">Amount</InputGroupAddon>
      <BigNumberInput />
      <InputGroupAddon border="both">$</InputGroupAddon>
      <InputGroupAddon>(USD)</InputGroupAddon>
    </InputGroup>
    <h4>Lg</h4>
    <InputGroup color="grey" style={{ width: '350px' }} sizer="lg">
      <InputGroupAddon border="right">Amount</InputGroupAddon>
      <BigNumberInput />
      <InputGroupAddon border="both">$</InputGroupAddon>
      <InputGroupAddon>(USD)</InputGroupAddon>
    </InputGroup>
  </div>
));
