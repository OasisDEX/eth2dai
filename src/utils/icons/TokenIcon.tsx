import classnames from 'classnames';
import * as React from 'react';

import { tokens } from '../../blockchain/config';
import * as styles from './TokenIcon.scss';

export const TokenIcon = ({ token }: { token: string }) => {
  const Icon = tokens[token].icon;
  return (<Icon />);
};

type TokenNames = 'eth' | 'weth' | 'dai';

type TokenBgColoredIconProps =
  React.HTMLAttributes<HTMLDivElement> &
  { className?: any,
    token: string,
  };
export const TokenBgColoredIcon = ({ token, className, ...props }: TokenBgColoredIconProps) => {
  const Icon = tokens[token].icon;
  const tokenName = token === 'WETH' ? 'weth' : token.toLocaleLowerCase() as TokenNames;
  return (
    <div
      className={classnames(styles.bgColored, styles[tokenName], className)}
      {...props}
    >
      <Icon />
    </div>
  );
};
