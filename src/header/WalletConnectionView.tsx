import classnames from 'classnames';
import * as React from 'react';
import { BehaviorSubject } from 'rxjs';
import { connectToWallet$ } from '../blockchain/wallet';
import { Button } from '../utils/forms/Buttons';
import { Checkbox } from '../utils/forms/Checkbox';
import { LoadingIndicator } from '../utils/loadingIndicator/LoadingIndicator';
import {
  getCurrentProviderName,
  Ledger,
  Metamask,
  Parity,
  Provider,
  Status,
  Trezor,
  Trust,
  WebWallet
} from '../utils/providers';
import * as styles from './WalletConnection.scss';

const hwWallets = [Trezor, Ledger];

const {
  section,
  heading,
  icon,
  list,
  single,
  item,
  wallet,
  inactive,
  selected,
  termsAndConditions,
  btn,
  connect,
  buttonPlaceholder,
} = styles;

const ListItem = (props: Provider & { className?: string, isSelected?: boolean, onSelect?: () => void, tid?: string }) => {
  const { supported, isSelected, className, name: fullName, icon: walletIcon, onSelect, tid } = props;
  return (
    <li className={
      classnames(
        item, wallet, className,
        !supported && inactive,
        isSelected && selected
      )
    }
        onClick={onSelect}
        data-test-id={tid}
    >
      <div className={icon}>{walletIcon}</div>
      <span>{fullName}</span>
    </li>
  );
};

const Panel = (props: { heading?: string | React.ReactNode, children?: any }) => {
  return (
    <section data-test-id="wallet-connection-panel" className={section}>
      <h4 data-test-id="heading" className={heading}>{props.heading}</h4>
      {
        props.children
      }
    </section>
  );
};

class SuggestedClients extends React.Component {
  public render() {
    return (
      <Panel heading="Get a Wallet">
        <ul className={list} data-test-id="suggested-clients">
          {
            [Metamask, Parity, Status, Trust].map((provider) => {
              return (
                <a key={provider.id} href={provider.website} rel="noreferrer noopener" target="_blank">
                  <ListItem id={provider.id}
                            icon={provider.iconWhite}
                            name={provider.name}
                            supported={provider.supported}
                  />
                </a>
              );
            })
          }
        </ul>
        <div className={buttonPlaceholder}>
          <Button size="lg"
                  color="grey"
                  className={classnames(btn, item)}
                  data-test-id="go-back"
                  onClick={this._goBack}
          >
            Back
          </Button>
        </div>
      </Panel>
    );
  }

  private _goBack = () => {
    walletConnectionViewManual$.next(WalletConnectionViewKind.noClient);
  }
}

class NotConnected extends React.Component<{}, { isChecked: boolean, selectedWallet: Provider }> {
  public constructor(props: any) {
    super(props);
    this.state = {
      isChecked: false,
      selectedWallet: {} as Provider
    };
  }

  public render() {
    const provider = getCurrentProviderName();
    return (
      <Panel heading="Connect Wallet">
        <ul className={list}>
          <ListItem icon={provider.icon}
                    name={provider.name}
                    supported={provider.supported}
                    isSelected={this.state.selectedWallet.id === provider.id}
                    onSelect={() => this._selectWallet(provider)}
                    tid="web-wallet"
          />
        </ul>
        <ul className={list}>
          {
            [...hwWallets].map((hwWallet) =>
              <ListItem key={hwWallet.id}
                        icon={hwWallet.icon}
                        name={hwWallet.name}
                        supported={hwWallet.supported}
                        isSelected={this.state.selectedWallet.id === hwWallet.id}/>
            )
          }
        </ul>
        <Checkbox name="tos"
                  data-test-id="accept-tos"
                  onChange={this._toggle}
                  className={termsAndConditions}
        >
          I accept&nbsp;<a target="_blank" rel="noopener noreferrer" href="/tos.pdf"> Terms of Service</a>
        </Checkbox>
        <div className={buttonPlaceholder}>
          <Button size="lg"
                  className={classnames(item, btn, connect)}
                  disabled={!this._canConnect()}
                  onClick={this._connect}
                  data-test-id="connect-wallet"
          >
            Connect
          </Button>
        </div>
      </Panel>
    );
  }

  private _toggle = () => {
    this.setState((state: any) => {
      const isChecked = !state.isChecked;
      return { isChecked };
    });
  }

  private _selectWallet = (selectedWallet: Provider) => {
    this.setState({ selectedWallet });
  }

  private _connect = () => {
    connectToWallet$.next();
  }

  private _canConnect = () => {
    const selectedWallet = this.state.selectedWallet;
    return this.state.isChecked &&
      selectedWallet && (
        selectedWallet.id !== undefined &&
        selectedWallet.id !== null
      );
  }
}

class NoClient extends React.Component<{}, { isChecked: boolean, selectedWallet: Provider }> {
  public constructor(props: any) {
    super(props);
    this.state = {
      isChecked: false,
      selectedWallet: {} as Provider
    };
  }

  public render() {
    return (
      <Panel heading="Connect Wallet">
        <ul className={list}>
          <ListItem icon={WebWallet.icon}
                    name={WebWallet.name}
                    supported={WebWallet.supported}
                    isSelected={this.state.selectedWallet.id === WebWallet.id}
                    onSelect={this._suggestClients}
                    tid="web-wallet"
          />
        </ul>
        <ul className={list}>
          {
            [...hwWallets].map((hwWallet) =>
              <ListItem key={hwWallet.id}
                        icon={hwWallet.icon}
                        name={hwWallet.name}
                        supported={hwWallet.supported}
                        isSelected={this.state.selectedWallet.id === hwWallet.id}/>
            )
          }
        </ul>
        <Checkbox name="tos"
                  data-test-id="accept-tos"
                  onChange={this._toggle}
                  className={termsAndConditions}
        >
          I accept&nbsp;<a target="_blank" rel="noopener noreferrer" href="/tos.pdf"> Terms of Service</a>
        </Checkbox>
        <div className={buttonPlaceholder}>
          <Button size="lg"
                  className={classnames(item, btn, connect)}
                  disabled={!this._canConnect()}
                  onClick={this._connect}
                  data-test-id="connect-wallet"
          >
            Connect
          </Button>
        </div>
      </Panel>
    );
  }

  private _toggle = () => {
    this.setState((state: any) => {
      const isChecked = !state.isChecked;
      return { isChecked };
    });
  }

  private _connect = () => {
    connectToWallet$.next();
  }

  private _canConnect = () => {
    const selectedWallet = this.state.selectedWallet;
    return this.state.isChecked &&
      selectedWallet && (
        selectedWallet.id !== undefined &&
        selectedWallet.id !== null
      )
      ;
  }

  private _suggestClients = () => {
    walletConnectionViewManual$.next(WalletConnectionViewKind.suggest);
  }
}

class Connected extends React.Component {
  public render() {
    return (
      <Panel heading={`${getCurrentProviderName().name} Connected`}>
        <ul className={classnames(list, single)}>
          {
            hwWallets.map((hwWallet) =>
              <ListItem id={hwWallet.id}
                        key={hwWallet.id}
                        icon={hwWallet.icon}
                        name={hwWallet.name}
                        supported={hwWallet.supported}/>
            )
          }
        </ul>
      </Panel>
    );
  }
}

const Connecting = (props: any) => {
  const _connectingContainerStyles = () => ({
    fontSize: '14px',
    letterSpacing: '.4px',
    lineHeight: '24px',
    height: '216px',
    color: '#828288',
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTop: '1px solid rgba(88, 88, 95, 0.2)',
    borderBottom: '1px solid rgba(88, 88, 95, 0.2)',
    flexDirection: 'column',
    textAlign: 'center'
  } as React.CSSProperties);

  return (
    <Panel heading="Connecting...">
      <div style={_connectingContainerStyles()}>
        <div>
          <LoadingIndicator size="lg"/>
          Waiting for Approval
          <br/>
          on {getCurrentProviderName().name}
        </div>
      </div>
      <div className={buttonPlaceholder}>
        <Button size="lg"
                className={classnames(item, btn)}
                onClick={props.close}
                data-test-id="connect-wallet"
        >
          Cancel
        </Button>
      </div>
    </Panel>
  );
};

export enum WalletConnectionViewKind {
  suggest = 'suggest',
  connected = 'connected',
  connecting = 'connecting',
  notConnected = 'notConnected',
  noClient = 'noClient',
}

export const walletConnectionViewManual$ = new BehaviorSubject('');

export const WalletConnectionViews = new Map<WalletConnectionViewKind>(
  [
    [WalletConnectionViewKind.connected, Connected],
    [WalletConnectionViewKind.notConnected, NotConnected],
    [WalletConnectionViewKind.noClient, NoClient],
    [WalletConnectionViewKind.suggest, SuggestedClients],
    [WalletConnectionViewKind.connecting, Connecting],
  ]);
