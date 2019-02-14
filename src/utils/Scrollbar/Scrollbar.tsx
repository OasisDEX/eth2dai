import * as React from 'react';
import { default as Scrollbars } from 'react-custom-scrollbars';
import * as styles from './Scrollbar.scss';

export class Scrollbar extends React.Component {
  public render() {

    return (
      <Scrollbars
        renderThumbVertical={(props:any) => <div {...props} className={styles.scrollbarThumb}/>}
        renderThumbHorizontal={(props:any) => <div {...props} className={styles.scrollbarThumb}/>}
      >
        { this.props.children}
      </Scrollbars>
    );
  }
}
