import { tid } from '../utils/index';
export class Tab {
}
Tab.exchange = () => {
    cy.get(tid('Exchange')).click();
};
Tab.margin = () => {
    cy.get(tid('Margin')).click();
};
Tab.balances = () => {
    cy.get(tid('Balances')).click();
};
