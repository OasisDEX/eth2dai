import classnames from 'classnames';
import * as React from 'react';

import { Loadable } from '../loadable';
import * as styles from './LoadingIndicator.scss';

interface LoadingIndicatorProps<T> {
  className?: string;
  loadable: Loadable<T>;
  children: (loaded: T) => React.ReactElement<any>;
  inline?: boolean;
  light?: boolean;
  error?:  React.ReactElement<any>;
}

export function WithLoadingIndicator<T>(props: LoadingIndicatorProps<T>) {
  const { className, loadable, children, inline, light, error } = props;
  switch (loadable.status) {
    case undefined:
    case 'loading':
      return (
        <LoadingIndicator inline={inline} light={light}/>
      );
    case 'error':
      if (error) {
        return (error);
      }
      return (
        <div className={
          classnames(styles.loading, className, { [styles.inline]: inline, [styles.light]: light })
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

export const LoadingIndicator = ({ className, inline, light, ...props }: {
  className?: string, inline?: boolean, light?: boolean
}) => {
  return (
    <div { ...props }
      className={classnames(
        styles.loading,
        className,
        { [styles.inline]: inline, [styles.light]: light }
      )
    } />
  );
};
