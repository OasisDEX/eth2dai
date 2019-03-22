import { BigNumber } from 'bignumber.js';
import * as React from 'react';

import * as infoSvg from '../../icons/info.svg';
import { GasEstimationStatus, HasGasEstimation } from '../form';
import { Money } from '../formatters/Formatters';
import { SvgImage } from '../icons/utils';
import { Muted } from '../text/Text';
import * as styles from './GasCost.scss';

export const GasCost = (props: HasGasEstimation) => {

  const { gasEstimationStatus, gasEstimationEth, gasEstimationUsd } = props;

  switch (gasEstimationStatus) {
    case GasEstimationStatus.calculating:
      return (<span>...</span>);
    case GasEstimationStatus.error:
      return (<span>error</span>);
    case GasEstimationStatus.unknown:
    case GasEstimationStatus.unset:
    case undefined:
    case GasEstimationStatus.calculated:
      const usd = gasEstimationUsd || new BigNumber(0);
      const eth = gasEstimationEth || new BigNumber(0);
      return (<span>
        {/* This space fixes this issue https://stackoverflow.com/questions/48704520/bootstrap-why-does-double-click-select-in-one-span-also-select-text-in-another*/}
        <Muted>~<Money value={eth} token="ETH"/></Muted>&nbsp;
        <Money value={usd} token="USD" style={{ marginLeft: '0.75em' }}/>
        { gasEstimationStatus === GasEstimationStatus.unknown &&
          <SvgImage image={infoSvg} className={styles.unknownIcon} title="Connect to enable gas cost estimation" />
        }
      </span>);
  }
};
