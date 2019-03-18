import classnames from 'classnames';
import * as React from 'react';

import errorSvg from '../../icons/error.svg';
import { SvgImage } from '../icons/utils';
import { Muted } from '../text/Text';
import * as styles from './LoggedOut.scss';

export const LoggedOut = ({ className, ...props }: {
  className?: string
}) => {
  return (
    <div
       className={classnames(styles.block, className)}
       { ...props }
    >
      <div className={styles.mainInfo}>
        <SvgImage image={errorSvg} className={styles.icon}/>
        Logged out
      </div>
      <Muted className={styles.annotate}>
        Please log in to see the data.
      </Muted>
    </div>
  );
};
