"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_sns_1 = require("@aws-sdk/client-sns");
const Clients_1 = require("./resources/Clients");
const web3_1 = __importDefault(require("web3"));
const web3 = new web3_1.default('https://data-seed-prebsc-1-s1.binance.org:8545');
const tokens = [
    "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    "0x55d398326f99059ff775485246999027b3197955",
    "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    "0xEC5dCb5Dbf4B114C9d0F65BcCAb49EC54F6A0867",
    "0x369c2333139dbB15c612F46ef8513F0768F31864"
];
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
const web3_sub = new web3_1.default("wss://bsc-testnet.nodereal.io/ws/v1/5d2c31fcd272410e986c2343bdadee45");
let options = {
    topics: [
        web3_sub.utils.sha3('Transfer(address,address,uint256)')
    ]
};
var subscription = web3_sub.eth.subscribe('logs', options, function (error, result) {
    if (!error)
        return null;
});
subscription.on('data', async (event) => {
    if (event.topics.length === 3) {
        let transaction = web3_sub.eth.abi.decodeLog([{
                type: 'address',
                name: 'from',
                indexed: true
            }, {
                type: 'address',
                name: 'to',
                indexed: true
            }, {
                type: 'uint256',
                name: 'value',
                indexed: false
            }], event.data, [event.topics[1], event.topics[2], event.topics[3]]);
        if (tokens.includes(event.address)) {
            const contract = new web3_sub.eth.Contract(abi, event.address);
            async function collectData(contract) {
                const [decimals, symbol] = await Promise.all([
                    contract.methods.decimals().call(),
                    contract.methods.symbol().call()
                ]);
                return { decimals, symbol };
            }
            await collectData(contract).then(contractData => {
                transaction.decimals = contractData.decimals;
                transaction.symbol = contractData.symbol;
            });
            console.log("transaction:", transaction);
            console.log(transaction?.to ?? "");
            const wallet = await Clients_1.dynamoDBDocumentClient.get({
                TableName: "CryptoWallets",
                // FilterExpression: "#address = :address",
                // ExpressionAttributeNames: {
                //     "#address": "address"
                // },
                // ExpressionAttributeValues: {
                //     ":address": transaction?.to??""
                // }
                Key: {
                    "address": transaction?.to ?? ""
                }
            }).then((response) => response.Item);
            console.log("wallet:", wallet);
            if (wallet && wallet.address) {
                const amount_ether_decimal = web3_sub.utils.fromWei(transaction.value, "ether");
                const deposit = {
                    user: wallet.user,
                    portfolio: wallet.portfolio,
                    amount: transaction.decimals === "18" ? amount_ether_decimal : (parseInt(amount_ether_decimal) * 10 ^ (18 - parseInt(transaction.decimals))).toString(),
                    asset: transaction.symbol,
                    type: "deposit"
                };
                console.log(deposit);
                Clients_1.snsClient.send(new client_sns_1.PublishCommand({
                    TopicArn: "arn:aws:sns:us-east-1:908741890320:asset-stream",
                    Message: JSON.stringify(deposit)
                }));
            }
        }
    }
});
