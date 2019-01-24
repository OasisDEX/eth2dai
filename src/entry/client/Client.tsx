import * as React from 'react';
import { SupportedClient } from '../../utils/icons/Icons';
import * as styles from './Client.scss';

type CLIENT_TYPE = 'metamask' | 'parity';

interface ClientProps {
  client: CLIENT_TYPE;
}

export class Client extends React.Component<ClientProps> {
  public render() {
    switch (this.props.client){
      case 'metamask':
        return (
          <a target="_blank" rel="noopener noreferrer"
             href="https://metamask.io"
            className={styles.client}>
            {SupportedClient.METAMASK()}
          </a>
        );
      case 'parity':
        return (
          <a target="_blank" rel="noopener noreferrer"
             href="https://parity.io"
            className={styles.client}>
            {SupportedClient.PARITY()}
          </a>
        );
    }
  }
}
