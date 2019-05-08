import classnames from 'classnames';
import * as React from 'react';

import { ProgressIcon } from '../icons/Icons';
import { Loadable } from '../loadable';
import * as styles from './LoadingIndicator.scss';

interface LoadingIndicatorProps<T> {
  className?: string;
  loadable: Loadable<T>;
  children: (loaded: T) => React.ReactElement<any>;
  inline?: boolean;
  size?: 'sm' | 'lg';
  error?: React.ReactElement<any>;
}

export function WithLoadingIndicator<T>(props: LoadingIndicatorProps<T>) {
  const { className, loadable, children, inline, size, error } = props;
  switch (loadable.status) {
    case undefined:
    case 'loading':
      return (
        <LoadingIndicator inline={inline} size={size}/>
      );
    case 'error':
      if (error) {
        return (error);
      }
      return (
        <div className={
          classnames(styles.loading, className, { [styles.inline]: inline })
        }>
          error!
        </div>
      );
    case 'loaded':
      return children(loadable.value as T);
  }
}

export function WithLoadingIndicatorInline<T>(props: LoadingIndicatorProps<T>) {
  return WithLoadingIndicator({ ...props, inline: true });
}

export const LoadingIndicator = ({ className, inline, light, size, ...props }: {
  className?: string, inline?: boolean, light?: boolean, size?: 'sm' | 'lg'
}) => {
  return (
    <div {...props}
         className={classnames(
           styles.loading,
           className,
           { [styles.inline]: inline, [styles.light]: light }
         )
         }>
      <ProgressIcon size={size}/>
    </div>
  );
};
