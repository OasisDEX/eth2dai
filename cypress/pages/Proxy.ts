import { tid } from '../utils';

export enum ProxyStatus {
  ENABLED = 'connected',
  MISSING = 'missing'
}

export const settings = () => cy.get(tid('account-settings'));

export const hasStatus = (status: ProxyStatus) => {
  switch (status) {
    case ProxyStatus.MISSING:
      cy.get(tid('proxy-status')).contains('Proxy not created');
      break;
    case ProxyStatus.ENABLED:
      cy.get(tid('proxy-status')).contains('Proxy available');
      break;
  }
};

export const  create = () => {
  cy.get(tid('create-proxy')).click();
};

export const  clear = () => cy.window().then((win: any) => {
  win.removeProxy();
});
