"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const ethereum_input_data_decoder_1 = __importDefault(require("ethereum-input-data-decoder"));
const alchemy_sdk_1 = require("alchemy-sdk");
const ABI = require('./ERC20.abi.json');
const decoder = new ethereum_input_data_decoder_1.default(ABI);
const add0x = (address) => ('0x' + (address?.replace('0x', '') ?? ''));
const abi = [{
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }];
//mainnet web3
const web3_rpcs = [
    { net_id: "1", url: "wss://rpc.ankr.com/eth/ws/", tokens: [["2", "eth"], ["3", "0xdac17f958d2ee523a2206206994597c13d831ec7"], ["4", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"]] },
    { net_id: "2", url: "wss://rpc.ankr.com/bsc/ws/", tokens: [["5", "eth"], ["3", "0x55d398326f99059fF775485246999027B3197955"], ["4", "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"]] },
    { net_id: "3", url: "wss://rpc.ankr.com/arbitrum/ws/", tokens: [["2", "eth"]] },
    { net_id: "4", url: "wss://rpc.ankr.com/polygon/ws/", tokens: [["3", "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"], ["4", "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"]] },
    { net_id: "5", url: "wss://rpc.ankr.com/optimism/ws/", tokens: [["9", "0x4200000000000000000000000000000000000042"]] },
    // {net_id: "9", url: "wss://rpc.ankr.com/solana/ws/", tokens: [["7", "eth"]]},
];
// testnet web3
const web3_rpcs_test = [
    { net_id: "1", url: "wss://rpc.ankr.com/eth_goerli/ws/", tokens: [["2", "eth"], ["3", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"]] },
    { net_id: "2", url: "wss://rpc.ankr.com/bsc_testnet_chapel/ws/", tokens: [["5", "eth"], ["3", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"]] },
    // {net_id: "4", url: "wss://rpc.ankr.com/polygon_mumbai/ws/", tokens: [["3", "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832"]]},
    // {net_id: "5", url: "wss://rpc.ankr.com/optimism_testnet/ws/", tokens: [["9", "0x4200000000000000000000000000000000000042"]]},
    // {net_id: "9", url: "wss://rpc.ankr.com/solana_devnet/ws/", tokens: [["7", "eth"]]},
];
//mainnet web3
const web3_static_rpcs = [
    { net_id: "1", url: "https://rpc.ankr.com/eth/", tokens: [["2", "eth"], ["3", "0xdac17f958d2ee523a2206206994597c13d831ec7"], ["4", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"]] },
    { net_id: "2", url: "https://rpc.ankr.com/bsc/", tokens: [["5", "eth"], ["3", "0x55d398326f99059fF775485246999027B3197955"], ["4", "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"]] },
    { net_id: "3", url: "https://rpc.ankr.com/arbitrum/", tokens: [["2", "eth"]] },
    { net_id: "4", url: "https://rpc.ankr.com/polygon/", tokens: [["3", "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"], ["4", "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"]] },
    { net_id: "5", url: "https://rpc.ankr.com/optimism/", tokens: [["9", "0x4200000000000000000000000000000000000042"]] },
    // {net_id: "9", url: "https://rpc.ankr.com/solana/", tokens: [["7", "eth"]]}, // https://mainnet.neonevm.org	
];
// testnet web3
// const web3_static_rpcs_test: RPC[] = [
//     {net_id: "1", url: "https://goerli.infura.io/v3/e2e27cf1335c43beb497124f3d140bf2", tokens: [["2", "eth"], ["3", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"], ["4", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"]]},
//     {net_id: "2", url: "https://bsc-testnet.nodereal.io/v1/5d2c31fcd272410e986c2343bdadee45", tokens: [["5", "eth"], ["3", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"], ["4", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"]]},
//     {net_id: "4", url: "https://rpc.ankr.com/polygon/", tokens: [["3", "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832"], ["4", "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832"]]}, //https://rpc-mumbai.matic.today
//     {net_id: "5", url: "https://goerli.optimism.io/", tokens: [["9", "0x4200000000000000000000000000000000000042"]]},
//     {net_id: "9", url: "https://api.devnet.solana.com/", tokens: [["7", "eth"]]}, // https://proxy.devnet.neonlabs.org/solana https://devnet.neonevm.org
// ]
const web3_static_rpcs_test = [
    { net_id: "1", url: "https://rpc.ankr.com/eth_goerli/37c6154886e5db365c84f60a21bb9e19834458378c8c17b47bb487d530cf2faf", tokens: [["2", "eth"], ["3", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"], ["4", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"]] },
    { net_id: "2", url: "https://rpc.ankr.com/bsc_testnet_chapel/37c6154886e5db365c84f60a21bb9e19834458378c8c17b47bb487d530cf2faf", tokens: [["5", "eth"], ["3", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"], ["4", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"]] },
    // {net_id: "4", url: "https://rpc.ankr.com/polygon/", tokens: [["3", "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832"], ["4", "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832"]]}, //https://rpc-mumbai.matic.today
    // {net_id: "5", url: "https://goerli.optimism.io/", tokens: [["9", "0x4200000000000000000000000000000000000042"]]},
    // {net_id: "9", url: "https://api.devnet.solana.com/", tokens: [["7", "eth"]]}, // https://proxy.devnet.neonlabs.org/solana https://devnet.neonevm.org
];
const settings = [
    {
        apiKey: "AoIXzbEuxWnRx70DnisXLVgz8thpY1Kp",
        network: alchemy_sdk_1.Network.ETH_GOERLI, // Replace with your network.
    }, {
        apiKey: "kO8USWVJVzBhahZwj8wfPnoDXsW_BAWJ",
        network: alchemy_sdk_1.Network.MATIC_MUMBAI, // Replace with your network.
    },
    {
        apiKey: "FDd94ewwsxBIf-sElD-latFk5bkDE8YM",
        network: alchemy_sdk_1.Network.ARB_GOERLI, // Replace with your network.
    }, {
        apiKey: "3iu34Tr7pRAEClLem56sdx6O9hj2OLDV",
        network: alchemy_sdk_1.Network.OPT_GOERLI, // Replace with your network.
    }
];
const web3_static_rpcs_test_alchemy = [
    { net_id: "1", url: "https://eth-goerli.g.alchemy.com/v2/AoIXzbEuxWnRx70DnisXLVgz8thpY1Kp" },
    // {net_id: "2", url: "https://rpc.ankr.com/bsc_testnet_chapel/37c6154886e5db365c84f60a21bb9e19834458378c8c17b47bb487d530cf2faf", tokens: [["5", "eth"], ["3", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"], ["4", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"]]},
    { net_id: "4", url: "https://polygon-mumbai.g.alchemy.com/v2/kO8USWVJVzBhahZwj8wfPnoDXsW_BAWJ" },
    { net_id: "3", url: "https://arb-goerli.g.alchemy.com/v2/FDd94ewwsxBIf-sElD-latFk5bkDE8YM" },
    { net_id: "5", url: "https://opt-goerli.g.alchemy.com/v2/3iu34Tr7pRAEClLem56sdx6O9hj2OLDV" },
    // // {net_id: "9", url: "https://api.devnet.solana.com/", tokens: [["7", "eth"]]}, // https://proxy.devnet.neonlabs.org/solana https://devnet.neonevm.org
];
settings.map((setting, index) => {
    const alchemy = new alchemy_sdk_1.Alchemy(setting);
    const web3_static_alchemy = new web3_1.default(web3_static_rpcs_test_alchemy[index].url);
    // Subscription for Alchemy's minedTransactions API
    const addresses = [...Array(10000).keys()].map(a => "0x775808cB53f5F419fE22e7c7Bf48234c88628192");
    alchemy.ws.on({
        method: "alchemy_pendingTransactions",
        toAddress: addresses,
        address: "0x"
        // fromAddress: "0xshah.eth",
    }, (tx) => {
        console.log(tx);
    });
});
// web3_rpcs_test.map((rpc: RPC, index: number) => {
//     const web3_static = new Web3(web3_static_rpcs_test[index].url);
//     const request = '{"id": 1, "method": "eth_subscribe", "params": ["newPendingTransactions"]}';  
//     const ws = new WebSocket(`${rpc.url}${process.env.ANKR_KEY}`);
//     ws.on('open', function open() {
//         ws.send(request);
//     });
//     ws.on('message', function incoming(data) {
//         const res = JSON.parse(data?.toString())
//         if (res.params && res.params["result"]) {
//             (async () => {
//                 const txInfo = await web3_static.eth.getTransaction(res.params['result']);
//                 if (txInfo) {
//                     const decode_result = decoder.decodeData(txInfo?.input);
//                     console.log("txInfo: ", txInfo?.to);
//                     console.log(decode_result?.inputs[0]);
//                     if ((decode_result.method === null && rpc.tokens.flatMap(a => a).includes("eth")) || (decode_result && decode_result?.method === "transfer" && rpc.tokens.flatMap(a => a).includes(add0x(txInfo?.to)))) {
//                         const to_address = add0x(decode_result && decode_result?.method === "transfer" ? decode_result?.inputs[0] : txInfo?.to);
//                         console.log("to_address:", to_address)
//                         const amount = decode_result && decode_result?.method === "transfer" ? web3_static.utils.fromWei(decode_result.inputs[1].toString(), "ether") : web3_static.utils.fromWei(txInfo.value, "ether")
//                         const wallet = await dynamoDBDocumentClient.scan({
//                             TableName: "CryptoWallets",
//                             FilterExpression: "#address = :address AND #net_id = :net_id",
//                             ExpressionAttributeNames: {
//                                 "#address": "public_key",
//                                 "#net_id": "net_id"
//                             },
//                             ExpressionAttributeValues: {
//                                 ":address": to_address,
//                                 ":net_id": rpc.net_id
//                             }
//                         }).then((response: any) => response.Items[0]??[])
//                         if(to_address.includes('7758') || add0x(txInfo?.to) == "0x07865c6e87b9f70255377e024ace6630c1eaa37f") {
//                             console.log(to_address)
//                             console.log(wallet)
//                         }
//                         if(wallet && wallet.public_key) {
//                             const deposit = {
//                                 user: wallet.user_id,
//                                 amount: amount,
//                                 asset: decode_result.method === null ? rpc.tokens[0][0] : rpc.tokens.filter(a => a[1] === txInfo.to)[0],
//                                 net: rpc.net_id,
//                                 time: Date.now()
//                             }
//                             console.log(deposit);
//                             // snsClient.send(new PublishCommand({
//                             //     TopicArn: process.env.ASSET_STREAM_TOPIC as string,
//                             //     Message: JSON.stringify(deposit)
//                             // }))
//                         }
//                         else {
//                             // console.log('Not ours!')
//                         }
//                     }
//                 }
//             })();
//         } else {
//             console.log(`Unexpected: ${data}`);
//         }
//     });
// });
