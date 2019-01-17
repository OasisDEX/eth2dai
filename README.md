# Oasis Dex Playground

[![CircleCI](https://circleci.com/gh/OasisDEX/oasis-dex.svg?style=svg&circle-token=4f9ebeca16d3e08d7650dfe420432cf0f1f508d7)](https://circleci.com/gh/OasisDEX/oasis-dex)

## Deployment

[dev branch](http://eth2dai-dev.surge.sh/)

## Storybook

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

## E2E tests
```
yarn cypress:dev  # to develop tests
```

```
yarn cypress:run  # to run all tests
```