import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { GasEstimationStatus, HasGasEstimation } from '../form';
import { Money } from '../formatters/Formatters';
import { Muted } from '../text/Text';

export const GasCost = (props: HasGasEstimation) => {

  const { gasEstimationStatus, gasEstimationEth, gasEstimationUsd } = props;

  switch (gasEstimationStatus) {
    case GasEstimationStatus.calculating:
      return (<span>...</span>);
    case GasEstimationStatus.error:
      return (<span>error</span>);
    case GasEstimationStatus.unset:
    case undefined:
      return (<span>
        <Muted>~{new BigNumber(0).toFixed(2)} USD</Muted>
        <Money value={new BigNumber(0)} token="ETH" style={{ marginLeft: '0.75em' }} />
      </span>);
    case GasEstimationStatus.calculated:
      const usd = gasEstimationUsd ? gasEstimationUsd : new BigNumber(0);
      const eth = gasEstimationEth ? gasEstimationEth : new BigNumber(0);
      return (<span>
        <Muted>~{usd.toFixed(2)} USD</Muted>
        <Money value={eth} token="ETH" style={{ marginLeft: '0.75em' }} />
      </span>);
  }
};
