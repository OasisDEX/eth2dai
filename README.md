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

### Unit tests

```
yarn test
```

### Storybook

```
yarn storybook
```

### Visual Regression

We use [Chromatic](https://www.chromaticqa.com/) to conduct visual regression tests with every PR.

To ignore given story use `ignoreDuringVisualRegression` helper.

Run (you will need `CHROMATIC_APP_CODE` env): 
```sh
yarn storybook:vis-reg
```

### E2E tests
```
yarn cypress:dev  # to develop tests
```

```
yarn cypress:run  # to run all tests
```