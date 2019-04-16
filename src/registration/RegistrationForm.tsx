import { fromPairs, toPairs } from 'ramda';
import * as React from 'react';
import { bindNodeCallback, combineLatest } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { filter, map, switchMap } from 'rxjs/operators';

import { account$, context$ } from '../blockchain/network';
import { web3 } from '../blockchain/web3';
import { connect } from '../utils/connect';
import { Button } from '../utils/forms/Buttons';
import { InputGroup, InputGroupAddon } from '../utils/forms/InputGroup';
import { Panel, PanelHeader } from '../utils/panel/Panel';
import * as styles from './RegistrationForm.scss';

interface RegistrationFormProps {
  account: string | undefined;
  kycBackend: {
    url: string;
  };
}

class RegistrationForm extends React.Component<RegistrationFormProps> {
  public render() {
    return (
      <Panel footerBordered={true} style={{ width: '100%' }}>
        <PanelHeader>Register</PanelHeader>
        <form className={styles.form} onSubmit={this.handleSubmit}>
          <InputGroup>
            <InputGroupAddon className={styles.inputLabel}>Email</InputGroupAddon>
            <input type="email" name="email" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon className={styles.inputLabel}>First name</InputGroupAddon>
            <input type="text" name="firstName" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon className={styles.inputLabel}>Last name</InputGroupAddon>
            <input type="text" name="lastName" />
          </InputGroup>
          <Button type="submit">Submit</Button>
        </form>
      </Panel>
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
