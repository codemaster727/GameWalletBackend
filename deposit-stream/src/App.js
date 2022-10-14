"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_sns_1 = require("@aws-sdk/client-sns");
const Clients_1 = require("./resources/Clients");
const web3_1 = __importDefault(require("web3"));
const ws_1 = __importDefault(require("ws"));
const ethereum_input_data_decoder_1 = __importDefault(require("ethereum-input-data-decoder"));
const ABI = require('./ERC20.abi.json');
const decoder = new ethereum_input_data_decoder_1.default(ABI);
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
    { net_id: "8", url: "wss://rpc.ankr.com/solana/ws/", tokens: [["7", "eth"]] },
];
// testnet web3
const web3_rpcs_test = [
    { net_id: "1", url: "wss://rpc.ankr.com/eth_goerli/ws/", tokens: [["2", "eth"], ["3", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"]] },
    { net_id: "2", url: "wss://rpc.ankr.com/bsc_testnet_chapel/ws/", tokens: [["5", "eth"], ["3", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"]] },
    { net_id: "4", url: "wss://rpc.ankr.com/polygon_mumbai/ws/", tokens: [["3", "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832"]] },
    { net_id: "5", url: "wss://rpc.ankr.com/optimism_testnet/ws/", tokens: [["9", "0x4200000000000000000000000000000000000042"]] },
    { net_id: "8", url: "wss://rpc.ankr.com/solana_devnet/ws/", tokens: [["7", "eth"]] },
];
web3_rpcs_test.map((rpc, index) => {
    const web3_static = new web3_1.default(rpc.url.replace("wss", "https").replace("/ws", "").concat(process.env.ANKR_KEY));
    const request = '{"id": 1, "method": "eth_subscribe", "params": ["newPendingTransactions"]}';
    const ws = new ws_1.default(`${rpc.url}${process.env.ANKR_KEY}`);
    ws.on('open', function open() {
        ws.send(request);
    });
    ws.on('message', function incoming(data) {
        const res = JSON.parse(typeof data == "string" ? data : data.toString());
        if (res.params != null && res.params["result"] != null) {
            (async () => {
                const txInfo = await web3_static.eth.getTransaction(res.params['result']);
                if (txInfo != null) {
                    // console.log(txInfo);
                    const decode_result = decoder.decodeData(txInfo.input);
                    console.log(decode_result.method === null && rpc.tokens.flatMap(a => a).includes("eth"));
                    console.log(decode_result.method !== null && decode_result?.method === "transfer" && rpc.tokens.flatMap(a => a).includes(txInfo?.to));
                    if ((decode_result.method === null && rpc.tokens.flatMap(a => a).includes("eth")) 
                        || (decode_result.method !== null && decode_result?.method === "transfer" && rpc.tokens.flatMap(a => a).includes(txInfo?.to))) {
                        const to_address = decode_result && decode_result?.method === "transfer" ? decode_result.inputs[0] : txInfo?.to;
                        const amount = decode_result && decode_result?.method === "transfer" ? web3_static.utils.fromWei(decode_result.inputs[1].toString(), "ether") : web3_static.utils.fromWei(txInfo.value, "ether");
                        const wallet = await Clients_1.dynamoDBDocumentClient.scan({
                            TableName: "CryptoWallets",
                            FilterExpression: "#address = :address AND #net_id = :net_id",
                            ExpressionAttributeNames: {
                                "#address": "public_key",
                                "#net_id": "net_id"
                            },
                            ExpressionAttributeValues: {
                                ":address": to_address,
                                ":net_id": rpc.net_id
                            }
                        }).then((response) => response.Items[0] ?? []);

                        if(to_address == "0x775808cB53f5F419fE22e7c7Bf48234c88628192") console.log(to_address);

                        if (wallet && wallet.public_key) {
                            const deposit = {
                                user: wallet.user_id,
                                amount: amount,
                                asset: decode_result.method === null ? rpc.tokens[0][0] : rpc.tokens.filter(a => a[1] === txInfo.to)[0],
                                net: rpc.net_id,
                                time: Date.now()
                            };
                            console.log(deposit);
                            Clients_1.snsClient.send(new client_sns_1.PublishCommand({
                                TopicArn: process.env.ASSET_STREAM_TOPIC,
                                Message: JSON.stringify(deposit)
                            }));
                        }
                        else {
                            // console.log('Not ours!')
                        }
                    }
                }
            })();
        }
        else {
            console.log(`Unexpected: ${data}`);
            console.log(res);
            console.log(res.params);
        }
    });
});
