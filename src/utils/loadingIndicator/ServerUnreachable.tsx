import classnames from 'classnames';
import * as React from 'react';

import errorSvg from '../../icons/error.svg';
import { SvgImage } from '../icons/utils';
import { Muted } from '../text/Text';
import * as styles from './ServerUnreachable.scss';

export const ServerUnreachable = ({ className, ...props }: {
  className?: string
}) => {
  return (
    <div
       className={classnames(styles.block, className)}
       { ...props }
    >
      <div className={styles.mainInfo}>
        <SvgImage image={errorSvg} className={styles.icon}/>
        Server unreachable
      </div>
      <Muted className={styles.annotate}>
        Please try again later or <a
          className={styles.link}
          target="_blank"
          rel="noopener noreferrer"
          href="https://chat.makerdao.com/channel/eth2dai">
        Contact us
      </a>
      </Muted>
    </div>
  );
};

export const ServerUnreachableInline = ({ className, fallback, ...props }: {
  className?: string
  fallback?: string | React.ReactChild,
}) => {
  return (
    <div
      className={classnames(styles.inline, className)}
      title={`Server unreachable!\nPlease try again later.`}
      {...props}
    >
      <SvgImage image={errorSvg} className={styles.icon}/>
      {fallback}
    </div>
  );
};
