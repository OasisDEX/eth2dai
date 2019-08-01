import * as React from 'react';
import { default as Scrollbars, positionValues } from 'react-custom-scrollbars';
import * as styles from './Scrollbar.scss';

export type ScrollState = positionValues;

interface ScrollbarProps {
  autoHeight?: boolean;
  onScroll?: () => void;
}

export class Scrollbar extends React.Component<ScrollbarProps> {

  private scroll = React.createRef<Scrollbars>();

  public center(elementOffset: number, elementHeight: number): void {
    if (this.scroll.current) {
      const { clientHeight } = this.scroll.current.getValues();
      this.scroll.current.scrollTop(elementOffset - ((clientHeight - elementHeight) / 2));
    }
  }

  public onScroll = () => {
    if (this.props.onScroll && this.scroll.current) {
      this.props.onScroll();
    }
  }

  public scrollState = (): ScrollState => {
    return (this.scroll.current && this.scroll.current.getValues()) as ScrollState;
  }

  public render() {
    return (
      <Scrollbars
        autoHeight={this.props.autoHeight}
        ref={this.scroll}
        renderThumbVertical={(props: any) => <div {...props} className={styles.scrollbarThumb}/>}
        renderThumbHorizontal={(props: any) => <div {...props} className={styles.scrollbarThumb}/>}
        onScroll={this.onScroll}
      >
        {this.props.children}
      </Scrollbars>
    );
  }
}
