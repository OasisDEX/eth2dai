import classnames from 'classnames';
import * as React from 'react';
import * as styles from './Panel.scss';

/*
* This component is used to place icons / button / indicators in the top right corner.
* */
export class TopRightCorner extends React.Component<any> {
  public render() {
    const className = this.props.className;

    return (
      <div {...this.props} className={classnames(className, styles.topRightCorner)}>
        {this.props.children}
      </div>
    );
  }
}

export class TopLeftCorner extends React.Component<any> {
  public render() {
    const className = this.props.className;

    return (
      <div {...this.props} className={classnames(className, styles.topLeftCorner)}>
        {this.props.children}
      </div>
    );
  }
}
