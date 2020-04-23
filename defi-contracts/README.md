## Tezos defi contracts
You will find some examples, such as a pool contract, and a contract with the Tezos specification fa1.2.

### Getting faucet
We are going to need some faucet to be able to interact with the contracts. You can download faucet from `https://faucet.tzalpha.net/` 
Replace the content of the faucetA and faucetB files with some faucet downloaded from the previous url.
This is in case the accounts run out of balance.

### Activating faucets
In case your faucet is new, you can activate it executing this command. If is already activate it the script will throw an error.
```
yarn activate
```

### Building
You can build the existing contracts, ligo.pool and fa12.ligo.

```shell
yarn build

// Only pool
yarn build:pool

// Only fa12
yarn build:token
```

### Deploying
You can deploy the existing contracts, ligo.pool and fa12.ligo, to the carthagenet network executing the following commands. Also the faucets files are going to be activated with this script.
```shell
yarn deploy

// Only pool
yarn deploy:pool

// Only fa12
yarn deploy:token
```

### Tests
To run the unit tests for the pool.ligo contract, you must execute the following command:
```
yarn test:pool
```

To run the unit tests for the fa12.ligo contract, you must execute the following command:
```
yarn test:token
```


To run the unit tests for the borrow methods, you must execute the following command:
```
yarn test:borrow
```

### Examples
[Here are some examples](https://github.com/protofire/tezos-defi-dapp/blob/master/defi-contracts/examples/):

You can run the examples with the following commands:

#### Deposit operation 

```
yarn example:deposit
```

![alt text][deposit]

[deposit]: https://i.imgur.com/rCFkdmO.png "Deposit operation"

#### Withdraw operation: 

```
yarn example:withdraw
```

![alt text][withdraw]

[withdraw]: https://i.imgur.com/E1GDf26.png "Withdraw operation"


#### Borrow operation: 

```
yarn example:borrow
```

![alt text][borrow]

[borrow]: https://i.imgur.com/VQKdXUY.png "Borrow operation"



#### Repay Borrow operation: 

```
yarn example:repayborrow
```

![alt text][repayborrow]

[repayborrow]: https://i.imgur.com/LVI10Cu.png "Repay borrow operation"
