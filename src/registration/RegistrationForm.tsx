import { fromPairs, toPairs } from 'ramda';
import * as React from 'react';
import { bindNodeCallback, combineLatest, Observable, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { catchError, filter, map, startWith, switchMap } from 'rxjs/operators';

import { account$, context$, onEveryBlock$ } from '../blockchain/network';
import { user$ } from '../blockchain/user';
import { web3 } from '../blockchain/web3';
import { connect } from '../utils/connect';
import { Button } from '../utils/forms/Buttons';
import { InputGroup, InputGroupAddon } from '../utils/forms/InputGroup';
import { Panel, PanelHeader } from '../utils/panel/Panel';
import * as styles from './RegistrationForm.scss';

export class RegistrationFormPanel extends React.Component {
  public render() {
    return (
      <Panel footerBordered={true} style={{ width: '100%' }}>
        <PanelHeader>Register</PanelHeader>
        <RegistrationTxRx />
      </Panel>
    );
  }
}

interface RegistrationFormProps {
  account: string | undefined;
  kycBackend: {
    url: string;
  };
}

class RegistrationForm extends React.Component<RegistrationFormProps> {
  public render() {
    return (
      <form className={styles.form} onSubmit={this.handleSubmit}>
        <InputGroup className={styles.inputRow}>
          <InputGroupAddon className={styles.inputLabel}>Email</InputGroupAddon>
          <div className={styles.inputTail}>
            <input type="email" name="email" className={styles.input} />
          </div>
        </InputGroup>
        <InputGroup className={styles.inputRow}>
          <InputGroupAddon className={styles.inputLabel}>First name</InputGroupAddon>
          <div className={styles.inputTail}>
            <input type="text" name="firstName" className={styles.input} />
          </div>
        </InputGroup>
        <InputGroup className={styles.inputRow}>
          <InputGroupAddon className={styles.inputLabel}>Last name</InputGroupAddon>
          <div className={styles.inputTail}>
            <input type="text" name="lastName" className={styles.input} />
          </div>
        </InputGroup>
        <Button size="lg" color="white" type="submit" className={styles.submit}>Sign &amp; submit</Button>
      </form>
    );
  }

  private handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fields = ['email', 'firstName', 'lastName'];
    const values = fromPairs(fields.map(f => [f, (e.target as any)[f].value] as [string, string]));
    const signData = [
      toPairs(values).map(([name, value]) => ({ name, value, type: 'string' })),
      this.props.account,
    ];
    bindNodeCallback(web3.currentProvider.sendAsync)({ method: 'eth_signTypedData', params: signData } as any).pipe(
      filter((result: { error?: any }) => !result.error),
      switchMap((signature : { result: string }) => ajax({
        url: this.props.kycBackend.url,
        body: { ...values, address: this.props.account, signature: signature.result },
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })),
    ).subscribe(console.log);
  }
}

export const RegistrationFormTxRx = connect(RegistrationForm, combineLatest(context$, account$).pipe(
  map(([context, account]) => ({ account, kycBackend: context.kycBackend })),
));

class Registration extends React.Component<{ status: RegistrationStatus }> {
  public render() {
    const description: { [key in RegistrationStatus]: string } = {
      unknown: 'In order to register please connect your wallet first.',
      error: 'Fill in the form to proceed.',
      pending: 'Please wait until your submission is processed...',
      approved: 'You have successfully registered!',
      denied: 'Your submission has been declined. You can try again.',
    };
    const showForm: { [key in RegistrationStatus]: boolean } = {
      unknown: false,
      error: true,
      pending: false,
      approved: false,
      denied: true,
    };
    console.log({ registrationStatus: this.props.status });
    return <>
      <p style={{ margin: '2em' }}>{ description[this.props.status] }</p>
      { showForm[this.props.status] && <RegistrationFormTxRx /> }
    </>;
  }
}

type RegistrationStatus = 'unknown' | 'error' | 'pending' | 'approved' | 'denied';

const registrationStatus$: Observable<RegistrationStatus> = combineLatest(user$, context$, onEveryBlock$).pipe(
  filter(([user]) => !!user.account),
  switchMap(([user, context]) => ajax({
    url: `${context.kycBackend.url}/${(user.account as string).replace(/^0x/, '')}`,
  })),
  map(({ response }) => response.status),
  catchError(() => of('error')),
  startWith('unknown' as RegistrationStatus),
);

const RegistrationTxRx = connect(Registration, registrationStatus$.pipe(
  map(status => ({ status })),
));
