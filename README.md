# Eth2Dai

[![CircleCI](https://circleci.com/gh/OasisDEX/eth2dai.svg?style=svg)](https://circleci.com/gh/OasisDEX/eth2dai)

**Eth2Dai** is a marketplace that allows fully on-chain exchange of **ETH** and **DAI** tokens. It uses the [**matching_market**](https://etherscan.io/address/0xb7ac09c2c0217b07d7c103029b4918a2c401eecb) smart contract on the Ethereum blockchain.

## Installation

To run `eth2dai` locally, clone the respository and then run from the command line:
```
yarn
yarn start
```

## Development

[dev branch](http://eth2dai-dev.surge.sh/)

### Local development

To start localnode (ganache) with oasis-cache do:

```
./scripts/dev.sh
```

NOTE: you need to have access to private docker images from oasisdexorg.

### Unit tests

```
yarn test
```

### Storybook

```
yarn storybook
```

## Visual Regression

We use SuperCI + reg-suit + storybook-chrome-screenshot or cypress to conduct visual regression tests with every PR.

#### Storybook

To ignore given story use `ignoreDuringVisualRegression` helper. To create screenshots locally, run: `yarn storybook:screenshots`.

#### Cypress E2E tests screenshots

E2E screenshots are pretty hard to make deterministic. We use two two attribute helpers: `data-vis-reg-mask` (to mask with black rectangle) and `data-vis-reg-hide` to hide entirely. Each screenshot is made in multiple sizes.

### E2E tests
```
yarn cypress:dev  # to develop tests
```

```
yarn cypress:run  # to run all tests
```

## Env files

By default app will try to load .env.$NODE_ENV file and fallback to .env. You can use ENV env variable to override this mechanism for example: ENV=dev will load .env.dev file.

### Feature switches

```
REACT_APP_INSTANT_ENABLED
```

Inside the app always check `process.env.REACT_APP_INSTANT_ENABLED = "1"` do not use any helpers to enable simple dead code elimination done by webpack.

```
REACT_APP_GRAPHQL_DEVMODE
```

A parameter forwarded to vulcan0x, useful for development purposes.

```
REACT_APP_TAX_EXPORTER_ENABLED
```

Enables Tax Exporter button on Account page. Feature allows user to export trade history into CSV format.
