import * as React from 'react';

import metamaskSvg from '../../icons/clients/metamask.svg';
import paritySvg from '../../icons/clients/parity.svg';
import { SvgImage } from '../../utils/icons/utils';
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
            <SvgImage image={metamaskSvg} />
          </a>
        );
      case 'parity':
        return (
          <a target="_blank" rel="noopener noreferrer"
             href="https://www.parity.io/ethereum"
            className={styles.client}>
            <SvgImage image={paritySvg} />
          </a>
        );
    }
  }
}
