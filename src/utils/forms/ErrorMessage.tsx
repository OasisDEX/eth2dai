import classnames from 'classnames';
import * as React from 'react';

import * as styles from './ErrorMessage.scss';

type ErrorMessageProps =
  React.HTMLAttributes<HTMLDivElement>
  & {
    // array of error message strings, sorted from most important:
    // the first one will be visible, others are shown on hover as list in given order
    messages: string[],
  };

export function ErrorMessage(props: ErrorMessageProps) {
  const { className, messages, ...otherProps } = props;
  return (
    <div className={classnames(styles.errors, className)}
         title={messages.reduce((title, msg) => title + '\n– ' + msg, '')}
         {...otherProps}
    >
      { messages.length > 0 && messages[0] }
    </div>
  );
}
