import * as React from 'react';
import { NetworkConfig } from '../blockchain/config';

export class Network extends React.Component<NetworkConfig, any> {
  public render() {
    return (
      <div>
        network: {this.props.id}, {this.props.name}, {this.props.label}
      </div>
    );
  }
}
