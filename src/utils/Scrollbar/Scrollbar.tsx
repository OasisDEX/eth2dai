import * as React from 'react';
import { default as Scrollbars } from 'react-custom-scrollbars';
import * as styles from './Scrollbar.scss';

export class Scrollbar extends React.Component {

  private scroll = React.createRef<Scrollbars>();

  public center(elementOffset:number, elementHeight: number) : void {
    if (this.scroll.current) {
      const { clientHeight } = this.scroll.current.getValues();
      this.scroll.current.scrollTop(elementOffset - ((clientHeight - elementHeight) / 2));

    }
  }

  public render() {

    return (
      <Scrollbars
        ref = {this.scroll}
        renderThumbVertical={(props:any) => <div {...props} className={styles.scrollbarThumb}/>}
        renderThumbHorizontal={(props:any) => <div {...props} className={styles.scrollbarThumb}/>}
      >
        { this.props.children}
      </Scrollbars>
    );
  }
}
