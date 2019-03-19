import classnames from 'classnames';
import * as React from 'react';

import radioSvg from '../../icons/radio.svg';
import { SvgImage } from '../icons/utils';
import { Muted } from '../text/Text';
import * as styles from './LoggedOut.scss';

export const LoggedOut = ({ view = 'the data', className, ...props }: {
  view?: string,
  className?: string,
}) => {
  return (
    <div
       className={classnames(styles.block, className)}
       { ...props }
    >
      <div className={styles.mainInfo}>
        <SvgImage image={radioSvg} className={styles.icon}/>
      </div>
      <Muted className={styles.annotate}>
        Connect to view {view}
      </Muted>
    </div>
  );
};
