import * as React from 'react';
import { NetworkConfig } from '../blockchain/config';
import * as styles from './Header.scss';

export class Network extends React.Component<NetworkConfig, any> {

  public render() {
    const network = this.props.name as 'kovan' || 'main';
    return (
      <div className={`${styles.networkIndicator} ${styles[network]}`}>
        {this.props.name}
      </div>
    );
  }
}
