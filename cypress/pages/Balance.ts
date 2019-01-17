import { tid } from "../utils/index";

export class Balance {
  public static of = (tokenSymbol: string) => {
    const symbol = tokenSymbol.toUpperCase();
    cy.get(tid(`${symbol}-overview`), { timeout: 10000 }).as(`${symbol}`);

    return {
      shouldBe: (amount: string | number | RegExp) => {
        cy.get(`@${symbol}`).within(() => {
          cy.get(tid(`${symbol}-balance`)).contains(amount, { timeout: 10000 });
        });
      },
    };
  };
}
