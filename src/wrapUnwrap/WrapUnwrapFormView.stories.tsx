import { storiesOf } from '@storybook/react';
import { BigNumber } from 'bignumber.js';
import * as React from 'react';

import { GasEstimationStatus, ProgressStage } from '../utils/form';
import { LoadableStatus } from '../utils/loadable';
import { MessageKind, WrapUnwrapFormKind, WrapUnwrapFormState } from './wrapUnwrapForm';
import { WrapUnwrapFormView } from './WrapUnwrapFormView';

const stories = storiesOf('Wrap&Unwrap modal', module);

function wrapDefaultProps(overrides: any = {}) {
  return {
    status: 'loaded' as LoadableStatus,
    kind: overrides.kind,
    value: {
      ethBalance: new BigNumber(150),
      wethBalance: new BigNumber(230),
      messages: [],
      gasEstimationStatus: GasEstimationStatus.unset,

      proceed: () => null,
      cancel: () => null,
      change: () => null,
      ...overrides
    } as WrapUnwrapFormState,
    close: () => null,
  };
}

stories.add('Base wrap modal', () => (
  <WrapUnwrapFormView kind={WrapUnwrapFormKind.wrap} {...wrapDefaultProps()}/>
));

stories.add('Base unwrap modal', () => (
  <WrapUnwrapFormView kind={WrapUnwrapFormKind.unwrap} {...wrapDefaultProps()}/>
));

stories.add('Base wrap modal with error', () => (
  <WrapUnwrapFormView
    {...wrapDefaultProps({
      kind: WrapUnwrapFormKind.wrap,
      amount: new BigNumber(300),
      messages: [
        { kind: MessageKind.insufficientAmount }
      ],
    })}
  />
));

stories.add('Base wrap modal filled and ready to proceed', () => (
  <WrapUnwrapFormView
    {...wrapDefaultProps({
      kind: WrapUnwrapFormKind.wrap,
      amount: new BigNumber(100),
      readyToProceed: true,
      gasEstimationStatus: GasEstimationStatus.calculated,
      gasEstimationEth: new BigNumber('0.01'),
      gasEstimationUsd: new BigNumber('0.3'),
    })}
  />
));

stories.add('Base wrap modal waitingForApproval', () => (
  <WrapUnwrapFormView
    {...wrapDefaultProps({
      kind: WrapUnwrapFormKind.wrap,
      amount: new BigNumber(100),
      readyToProceed: true,
      progress: ProgressStage.waitingForApproval,
      gasEstimationStatus: GasEstimationStatus.calculated,
      gasEstimationEth: new BigNumber('0.01'),
      gasEstimationUsd: new BigNumber('0.3')
    })}
  />
));

stories.add('Base wrap modal waitingForConfirmation', () => (
  <WrapUnwrapFormView
    {...wrapDefaultProps({
      kind: WrapUnwrapFormKind.wrap,
      amount: new BigNumber(100),
      readyToProceed: true,
      progress: ProgressStage.waitingForConfirmation,
      gasEstimationStatus: GasEstimationStatus.calculated,
      gasEstimationEth: new BigNumber('0.01'),
      gasEstimationUsd: new BigNumber('0.3')
    })}
  />
));

stories.add('Base wrap modal done', () => (
  <WrapUnwrapFormView
    {...wrapDefaultProps({
      kind: WrapUnwrapFormKind.wrap,
      amount: new BigNumber(100),
      readyToProceed: true,
      progress: ProgressStage.done,
      gasEstimationStatus: GasEstimationStatus.calculated,
      gasEstimationEth: new BigNumber('0.01'),
      gasEstimationUsd: new BigNumber('0.3'),
    })}
  />
));

stories.add('Base wrap modal fiasco', () => (
  <WrapUnwrapFormView
    {...wrapDefaultProps({
      kind: WrapUnwrapFormKind.wrap,
      amount: new BigNumber(100),
      readyToProceed: true,
      progress: ProgressStage.fiasco,
      gasEstimationStatus: GasEstimationStatus.calculated,
      gasEstimationEth: new BigNumber('0.01'),
      gasEstimationUsd: new BigNumber('0.3'),
    })}
  />
));

stories.add('Base wrap modal canceled', () => (
  <WrapUnwrapFormView
    {...wrapDefaultProps({
      kind: WrapUnwrapFormKind.wrap,
      amount: new BigNumber(100),
      readyToProceed: true,
      progress: ProgressStage.canceled,
      gasEstimationStatus: GasEstimationStatus.calculated,
      gasEstimationEth: new BigNumber('0.01'),
      gasEstimationUsd: new BigNumber('0.3'),
    })}
  />
));
