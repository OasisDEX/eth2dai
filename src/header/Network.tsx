import * as React from 'react';
import { NetworkConfig } from '../blockchain/config';
import { Tooltip } from '../utils/tooltip/Tooltip';
import * as styles from './Header.scss';

const Networks = {
  kovan: 'Kovan',
  main: 'Main'
};

export class Network extends React.Component<NetworkConfig, any> {

  public render() {
    const network = this.props.name as 'kovan' || 'main';
    const id = 'status';
    return (
      <Tooltip id={id} text={`${Networks[network]} Network`}>
        <span data-tip={true}
              data-for={id}
              className={`${styles.networkIndicator} ${styles[network]}`}
        />
      </Tooltip>
    );
  }
}
