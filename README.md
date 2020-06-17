[![CircleCI](https://circleci.com/gh/protofire/tezos-defi-dapp.svg?style=svg)](https://circleci.com/gh/protofire/tezos-defi-dapp)
[![Netlify Status](https://api.netlify.com/api/v1/badges/3faddc9d-aa40-48f2-a98d-1862bac37c30/deploy-status)](https://app.netlify.com/sites/tezosdefidapp/deploys)

# Tezos DeFi DApp
Implementations for common smart contract patterns of popular DeFi applications and a user interface with high-level DeFi functionality. These implementations can be used as templates or starter kits to bootstrap new applications, therefore, greatly increasing developer productivity at the start of new projects.
Checkout a [demo](https://tezosdefidapp.netlify.app/).

## Getting started
A quick introduction to the minimum setup you need to get a Tezos DeFi DApp up and running.

### Sections

#### Home
<img src="https://i.ibb.co/Rbqqcy2/Screenshot-20200522-161648.png" width="600">
 
#### Modal Borrow 
<img src="https://i.ibb.co/p3sWTnN/Screenshot-20200522-161729.png" width="600"> 

#### Modal Supply
<img src="https://i.ibb.co/hBPDPdq/Screenshot-20200522-161702.png" width="600"> 

### Prerequisites
To set up a development environment, follow the links below to see installation instructions.
- [Node.js](https://nodejs.org/es/download/) (v10.20.1 or higher)
- [Ligo](https://ligolang.org/docs/intro/installation) (the latest version)
- [Yarn](https://classic.yarnpkg.com/en/docs/install#debian-stable) (v1.12.3)
- [React](https://reactjs.org) (v16.13.1)

### Setting up a development environment

```shell
git git@github.com:protofire/tezos-defi-dapp.git
cd tezos-defi-dapp/
yarn install
```

### Contracts
The contracts are located in the folder [defi-contracts](https://github.com/protofire/tezos-defi-dapp/blob/master/defi-contracts) .
For more details, you can check out the [README](https://github.com/protofire/tezos-defi-dapp/blob/master/defi-contracts/README.md) file.

### Application
The React-based application can be found in the [defi-dapp](https://github.com/protofire/tezos-defi-dapp/blob/master/defi-dapp) folder.

### Oracle
We use an Oracle only for showing the USD on the react frontend. For more information about how the oracle works you can check the [oracle repository](https://github.com/protofire/tezos-price-oracle).

## Blog posts
We have written a series of blog posts that will guide you through the concepts of DeFi smart contracts in Tezos.

* [How to Integrate JavaScript with Smart Contracts and Run Unit Tests](https://medium.com/protofire-blog/tezos-part-4-how-to-integrate-javascript-with-smart-contracts-and-run-unit-tests-c36756149e9d)
* [Token standards](https://medium.com/protofire-blog/tezos-part-5-token-standards-28b8733a3ce5)
* [Recommendations to Enhance Security of Tezos Smart Contracts](https://medium.com/protofire-blog/recommendations-to-enhance-security-of-tezos-smart-contracts-d14c0e53a6d3)
* [Enabling smart contract interactions in Tezos with ligo contracts and CPS](https://medium.com/protofire-blog/enabling-smart-contract-interaction-in-tezos-with-ligo-functions-and-cps-e3ea2aa49336)
* [Explaining Smart Contracts](https://github.com/protofire/tezos-defi-dapp/blob/master/defi-docs)

### Licensing
[MIT](https://github.com/protofire/tezos-defi-dapp/blob/master/LICENSE)
