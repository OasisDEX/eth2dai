import classnames from 'classnames';
import * as React from 'react';

import * as styles from './Panel.scss';

export type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  footerBordered?: boolean,
};

export const Panel = (props: PanelProps) => {
  const { className, children, footerBordered, ...divProps } = props;
  return (
    <div className={classnames(className, {
      [styles.panel]: true,
      [styles.panelWithFooterBordered]: footerBordered,
    })} {...divProps}>
      {children}
    </div>
  );
};

export type PanelHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  bordered?: boolean,
  children?: any,
};
export const PanelHeader = (props: PanelHeaderProps) => {
  const { className, bordered, children, ...divProps } = props;
  return (
    <div className={classnames(className, {
      [styles.panelHeader]: true,
      [styles.panelHeaderBordered]: bordered,
    })} {...divProps}>
      {children}
    </div>
  );
};

export type PanelBodyProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: any,
  paddingVertical?: boolean,
  paddingTop?: boolean,
  paddingBottom?: boolean,
  scrollable?: boolean,
};

export const PanelBody = (props: PanelBodyProps) => {
  const {
    children,
    paddingVertical,
    paddingTop,
    paddingBottom,
    scrollable,
    className,
    ...divProps } = props;
  return (
    <div className={classnames(styles.panelBodyHorizontal, className, {
      [styles.panelBodyBottom]: paddingBottom || paddingVertical,
      [styles.panelBodyTop]: paddingTop || paddingVertical,
      [styles.panelBodyScrollable]: scrollable,
    })} {...divProps}>
      {children}
    </div>
  );
};

export const PanelFooter = ({ children, className, bordered, ...props }:
                              { children: any, className?: any, bordered?: boolean } | any) => (
  <div className={classnames(styles.panelFooter, {
    [styles.panelFooterBordered]: bordered,
    [className]: className
  })} {...props}>
    {children}
  </div>
);
