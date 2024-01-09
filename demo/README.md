# custodial-btc

### Getting started

This application depends on a locally running regtest bitcoin node. Follow the steps below to get the node running:

1. Install bitcoin with

```
brew install bitcoin
```

2. Navigate to `~/Library/Application Support/Bitcoin` and update `bitcoin.conf` with the following configuration:

```
regtest=1
server=1
rpcuser=test
rpcpassword=test
[regtest]
rpcbind=127.0.0.1
rpcallowip=0.0.0.0/0
rpcport=8337
fallbackfee=0.0001
```

More information about this file [can be found here](https://github.com/bitcoin/bitcoin/blob/master/doc/bitcoin-conf.md#configuration-file-path)

3. Start your bitcoin node in regtest from terminal with

```
bitcoind -regtest
```

4. Create a `.env` file following the `.env.example` in `/apps/server` (NOTE: any valid bip39 seed phrase will work for the `CUSTODIAL_SEED_PHRASE` env var)

1. Install the necessary dependencies by running the following command from the root of this directory:

```
pnpm i
```

6. Start both the client and server by running the following command:

```
pnpm dev
```

7. Seed your Bitcoin network with the funds and wallets necessary to run this app by running the following command from the command line:

```
curl http://localhost:8080/bootstrap
```

8. Open the react app in your browser

```
http://localhost:5173
```

### Build

To build all apps and packages, run the following command:

```
pnpm build
```

### Develop

To develop all apps and packages, run the following command:

```
pnpm dev
```
