import classnames from 'classnames';
import * as React from 'react';

import * as styles from './ErrorMessage.scss';

type ErrorMessageProps =
  React.HTMLAttributes<HTMLDivElement>
  & {
    // array of error messages, sorted from most important:
    // the first one will be visible, others are shown on hover as list in given order
    messages: React.ReactChild[],
  };

export function ErrorMessage(props: ErrorMessageProps) {
  const { className, messages, ...otherProps } = props;
  return (
    <div className={classnames(styles.errors, className)}
         title={messages
           .reduce((title: string, msg: React.ReactChild) => `${title}\n${getInnerText(msg)}`, '')
         }
         {...otherProps}
    >
      { messages.length > 0 && messages[0] }
    </div>
  );
}

// https://gist.github.com/slavikshen/7b29b06215b9e7a08455
// How to get inner text in React virtual DOM
function getInnerText(obj: any): string {
  let buf = '';
  if (obj) {
    const type = typeof(obj);
    if (type === 'string' || type === 'number') {
      buf += obj;
    } else if (type === 'object') {
      let children = null;
      if (Array.isArray(obj)) {
        children = obj;
      } else {
        const props = obj.props;
        if (props) {
          children = props.children;
        }
      }
      if (children) {
        if (Array.isArray(children)) {
          children.forEach((o) => {
            buf += getInnerText(o);
          });
        } else {
          buf += getInnerText(children);
        }
      }
    }
  }
  return buf;
}
