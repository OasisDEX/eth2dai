import * as React from 'react';
import { SupportedClient } from '../../utils/icons/Icons';
import * as styles from './Client.scss';

export class Client extends React.Component {
  public render() {
    return (
      <div className={styles.client}>
        {SupportedClient.METAMASK()}
      </div>
    );
  }
}
