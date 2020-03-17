### tezos-defi-dapp
User interface with high level of deFi functionalities 


### Download faucet ...
You can download faucet from `https://faucet.tzalpha.net/` 
Replace the content of the faucetA and faucetB files with some faucet downloaded from the previous url.
This is in case the accounts run out of balance.

### Installing
Execute this command
```
yarn install
```
### Activate faucets
In case your faucet is new, you can activate it executing this command. If is already activate it the script will throw an error.
```
yarn activate
```

### Build
You can build the existing contracts, ligo.pool and fa12.ligo executing this command
```
yarn build

// Only pool
yarn build:pool

// Only fa12
yarn build:token
```

### Deploy
You can deploy the existing contracts, ligo.pool and fa12.ligo, to the carthagenet network executing this command. Also the faucets files are going to be activated with this script.
```
yarn deploy

// Only pool
yarn deploy:pool

// Only fa12
yarn deploy:token
```

### Running unit tests
To run the unit tests for the pool.ligo contract, you must execute the following command:
```
yarn test:pool
```

To run the unit tests for the fa12.ligo contract, you must execute the following command:
```
yarn test:token
```

To run the unit tests for some interactions between contracts, you must execute the following command:
```
yarn test:interaction
```