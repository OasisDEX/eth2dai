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
    case GasEstimationStatus.calculated:
      const usd = gasEstimationUsd || new BigNumber(0);
      const eth = gasEstimationEth || new BigNumber(0);
      return (<span>
        <Muted>~<Money value={eth} token="ETH"/></Muted>
        <Money value={usd} token="USD" style={{ marginLeft: '0.75em' }}/>
      </span>);
  }
};
