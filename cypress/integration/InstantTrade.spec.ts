import { ApplicationState } from '../pages/Application';
import { Tab } from '../pages/Tab';
import { cypressVisitWithWeb3, tid } from '../utils';

import { makeScreenshots } from '../utils/makeScreenshots';

const defaultTimeout = { timeout: 15000 };

const waitForBalancesToLoad = () => {
  cy.get(tid('selling-token', tid('balance')), defaultTimeout).contains(/1,001.../);
  cy.get(tid('buying-token', tid('balance')), defaultTimeout).contains(/170.../);
};

describe('Instant trade', () => {

  beforeEach(() => {
    cypressVisitWithWeb3();
    ApplicationState.acceptToS();
    Tab.instant();
    waitForBalancesToLoad();
  });

  it('should calculate how much the user will receive', () => {
    cy.get(tid('selling-token', tid('amount')), { ...defaultTimeout }).type('1');
    cy.get(tid('buying-token', tid('amount')), { ...defaultTimeout }).should('have.value', '280.00');

    makeScreenshots('instant-trade');
  });

  it('should calculate how much the user will pay', () => {
    cy.get(tid('buying-token', tid('amount')), { ...defaultTimeout }).type('280.00');
    cy.get(tid('selling-token', tid('amount')), { ...defaultTimeout }).should('have.value', '1.00000');
  });

  it('should remove how much the user will receive if the pay value is cleared', () => {
    cy.get(tid('selling-token', tid('amount')), { ...defaultTimeout }).type('0.5');
    cy.get(tid('buying-token', tid('amount')), { ...defaultTimeout }).should('have.value', '140.00');

    cy.get(tid('selling-token', tid('amount')), { ...defaultTimeout }).type('{backspace}{backspace}{backspace}');
    cy.get(tid('buying-token', tid('amount')), { ...defaultTimeout }).should('have.value', '');
  });

  it('should remove how much the user will pay if the buy value is cleared', () => {
    cy.get(tid('buying-token', tid('amount')), { ...defaultTimeout }).type('140');
    cy.get(tid('selling-token', tid('amount')), { ...defaultTimeout }).should('have.value', '0.50000');

    cy.get(tid('buying-token', tid('amount')), { ...defaultTimeout }).type('{backspace}{backspace}{backspace}');
    cy.get(tid('selling-token', tid('amount')), { ...defaultTimeout }).should('have.value', '');
  });

  it('should allow swapping the tokens', () => {
    cy.get(tid('swap'), { ...defaultTimeout }).click();

    cy.get(tid('selling-token', tid('balance')), { ...defaultTimeout }).contains(/170.../);
    cy.get(tid('buying-token', tid('balance')), { ...defaultTimeout }).contains(/1.001.../);
  });

  it('should clear input fields if populated on swap', () => {
    cy.get(tid('selling-token', tid('amount')), { ...defaultTimeout }).type('1');
    cy.get(tid('buying-token', tid('amount')), { ...defaultTimeout }).should('have.value', '280.00');

    cy.get(tid('swap'), { ...defaultTimeout }).click();

    cy.get(tid('selling-token', tid('balance')), { ...defaultTimeout }).contains(/170.../);
    cy.get(tid('buying-token', tid('balance')), { ...defaultTimeout }).contains(/1.001.../);
  });

  it('should display error if balance is too low', () => {
    cy.get(tid('swap'), { ...defaultTimeout }).click();

    cy.get(tid('selling-token', tid('amount')), { ...defaultTimeout }).type('200');
    cy.get(tid('error'), { ...defaultTimeout }).contains(`Balance too low`);
  });
});
