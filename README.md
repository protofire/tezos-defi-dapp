[![CircleCI](https://circleci.com/gh/protofire/tezos-defi-dapp.svg?style=svg)](https://circleci.com/gh/protofire/tezos-defi-dapp)
[![Netlify Status](https://api.netlify.com/api/v1/badges/3faddc9d-aa40-48f2-a98d-1862bac37c30/deploy-status)](https://app.netlify.com/sites/tezosdefidapp/deploys)

# Tezos defi dapp
Implementations for common smart contract patterns of popular deFi applications and a User interface with high level of deFi functionalities.

These implementations can be used as templates or starter kits to bootstrap new applications, greatly increasing developer productivity at the start of new projects.


## Demo
[LIVE DEMO](https://tezosdefidapp.netlify.app/)

You can download wallets from the [faucet](https://faucet.tzalpha.net/) to use the dApp.


## Sections

#### Home
<img src="https://i.ibb.co/Rbqqcy2/Screenshot-20200522-161648.png" width="600">
 
#### Modal Borrow 
<img src="https://i.ibb.co/p3sWTnN/Screenshot-20200522-161729.png" width="600"> 

#### Modal Supply
<img src="https://i.ibb.co/hBPDPdq/Screenshot-20200522-161702.png" width="600"> 


## Getting started

A quick introduction of the minimal setup you need to get Tezos defi dapp up & running.


### Prerequisites
What is needed to set up the dev environment, click in the link to see installation instructions.
- [Node.js](https://nodejs.org/es/download/) , version >= v10.20.1
- [Ligo](https://ligolang.org/docs/intro/installation) , latest version
- [Yarn](https://classic.yarnpkg.com/en/docs/install#debian-stable) , version ^1.12.3
- [React](https://reactjs.org) , version ^16.13.1


### Setting up Dev

```shell
git git@github.com:protofire/tezos-defi-dapp.git
cd tezos-defi-dapp/
yarn install
```

### Contracts
The contracts are located in the folder [defi-contracts](https://github.com/protofire/tezos-defi-dapp/blob/master/defi-contracts) .
You can check the [README](https://github.com/protofire/tezos-defi-dapp/blob/master/defi-contracts/README.md) file of the contracts for more help.

### Application
It was created with React, and it's in the folder [defi-dapp](https://github.com/protofire/tezos-defi-dapp/blob/master/defi-dapp) .

## Blog posts
We have written a series of blogpost that will guide you into some defi concepts with tezos.

* [How to Integrate JavaScript with Smart Contracts and Run Unit Tests](https://medium.com/protofire-blog/tezos-part-4-how-to-integrate-javascript-with-smart-contracts-and-run-unit-tests-c36756149e9d)
* [Token standards](https://medium.com/protofire-blog/tezos-part-5-token-standards-28b8733a3ce5)
* [Smart contract explanation](https://github.com/protofire/tezos-defi-dapp/blob/master/defi-docs)

### Licensing
[MIT](https://github.com/protofire/tezos-defi-dapp/blob/master/LICENSE)
