import * as React from 'react';
import * as ReactDOM from 'react-dom';

export interface ModalProps {
  close: () => void;
}

export interface ModalOpenerProps {
  open: (modalClass: React.ComponentType<ModalProps>) => void;
}

interface WrapperState {
  modalType?: React.ComponentType<ModalProps>;
}

class ReRenderBarrier extends React.Component {
  public shouldComponentUpdate(): boolean {
    return false;
  }

  public render() {
    return this.props.children;
  }
}

export function withModal<O, P extends ModalOpenerProps>(
  Wrapped: React.ComponentType<O & P>
): React.ComponentType<O> {

  return class extends React.Component<O, WrapperState> {
    constructor(o: O) {
      super(o);
      this.open = this.open.bind(this);
      this.close = this.close.bind(this);
      this.state = {};
    }

    public render() {
      return <React.Fragment>
        <ReRenderBarrier>
          <Wrapped { ...{ ...this.props as any, open: this.open } as Readonly<P> }/>
        </ReRenderBarrier>
        {this.state.modalType !== undefined &&
        ReactDOM.createPortal(
          <this.state.modalType {...{ close: this.close }}/>,
          document.body)}
      </React.Fragment>;
    }

    private open(modalType: React.ComponentType<ModalProps>) {
      this.setState({ ...this.state, modalType });
    }

    private close(): void {
      this.setState({ ...this.state, modalType: undefined });
    }
  };
}
