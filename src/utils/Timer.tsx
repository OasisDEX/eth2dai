import * as React from 'react';

interface TimerProps {
  start: Date;
}

export class Timer extends React.Component<TimerProps, { elapsed: number }> {
  private timer: any;

  public constructor(props: TimerProps) {
    super(props);
    this.state = {
      elapsed: 0,
    };
    this.tick = this.tick.bind(this);
  }

  public componentDidMount() {
    this.timer = setInterval(this.tick, 50);
  }

  public componentWillUnmount() {
    clearInterval(this.timer);
  }

  public render() {
    const elapsed = Math.round(this.state.elapsed / 100);
    const seconds = (elapsed / 10).toFixed(1);
    const width = (seconds.length - 1) * 7.5 + 3;
    return <span style={ { display: 'inline-block', width: `${width}px` } }>{seconds}</span>;
  }

  private tick() {
    this.setState({
      elapsed: new Date().valueOf() - this.props.start.valueOf()
    });
  }
}

export class SecondsTimer extends Timer {
  public render() {
    const elapsed = Math.round(this.state.elapsed / 1000);
    const minutes = Math.floor(elapsed / 60).toFixed(0);
    const seconds = (elapsed % 60).toFixed(0).padStart(2, '0');

    return <span>{minutes}:{seconds}</span>;
  }
}
