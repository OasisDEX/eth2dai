import * as React from 'react';
import { NetworkConfig } from '../blockchain/config';
import * as styles from './Header.scss';

export class Network extends React.Component<NetworkConfig, any> {
  public render() {
    return (
      <div className={`${styles.networkIndicator} Header_${this.props.name}`}>
        {this.props.name}
      </div>
    );
  }
}
