import { PublishCommand } from "@aws-sdk/client-sns"
import { snsClient, dynamoDBDocumentClient } from "./resources/Clients"
import Web3 from "web3"
import WebSocket from "ws"
import { AbiItem } from "web3-utils"
import InputDataDecoder from 'ethereum-input-data-decoder';
const ABI = require('./ERC20.abi.json');
console.log(ABI);
const decoder = new InputDataDecoder(ABI);
// import * as dotenv from 'dotenv'

// dotenv.config()

// const web3_eth_test = new Web3('https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
// const web3_bsc_test = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');

type RPC = {
    net_id: string
    url: string
    tokens: string[][]
}

const net2token = (value: string): string => {
    let token_id = 2;
    switch (value) {
        case "1":
            token_id = 2
            break;
        case "2":
            token_id = 5
            break;
        case "3":
            token_id = 2
            break;
        case "4":
            token_id = 3
            break;
        case "5":
            token_id = 9
            break;
        case "6":
            token_id = 1
            break;
        case "7":
            token_id = 3
            break;
        case "8":
            token_id = 6
            break;
        case "9":
            token_id = 7
            break;
        case "10":
            token_id = 8
            break;
    
        default:
            break;
    }
    return token_id.toString();
}

const tokens: string[] = [
    "0x88e8676363E1d4635a816d294634905AF292135A"
]
const tokens_bsc_test: string[] = [
    "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    "0x55d398326f99059ff775485246999027b3197955",
    "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    "0xEC5dCb5Dbf4B114C9d0F65BcCAb49EC54F6A0867",
    "0x369c2333139dbB15c612F46ef8513F0768F31864"
]

const abi: AbiItem[] = [{
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
const web3_rpcs: RPC[] = [
    {net_id: "1", url: "wss://rpc.ankr.com/eth/ws/", tokens: [["2", "eth"], ["3", "0xdac17f958d2ee523a2206206994597c13d831ec7"], ["4", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"]]},
    {net_id: "2", url: "wss://rpc.ankr.com/bsc/ws/", tokens: [["5", "eth"], ["3", "0x55d398326f99059fF775485246999027B3197955"], ["4", "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"]]},
    {net_id: "3", url: "wss://rpc.ankr.com/arbitrum/ws/", tokens: [["2", "eth"]]},
    {net_id: "4", url: "wss://rpc.ankr.com/polygon/ws/", tokens: [["3", "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"], ["4", "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"]]},
    {net_id: "5", url: "wss://rpc.ankr.com/optimism/ws/", tokens: [["9", "0x4200000000000000000000000000000000000042"]]},
    {net_id: "8", url: "wss://rpc.ankr.com/solana/ws/", tokens: [["7", "eth"]]},
]
// const web3_eth = new Web3(`wss://rpc.ankr.com/eth/ws/${process.env.ANKR_KEY}`)
// const web3_bsc = new Web3(`wss://rpc.ankr.com/bsc/ws/${process.env.ANKR_KEY}`)
// const web3_arbitrum = new Web3(`wss://rpc.ankr.com/arbitrum/ws/${process.env.ANKR_KEY}`)
// const web3_optimism = new Web3(`wss://rpc.ankr.com/optimism/ws/${process.env.ANKR_KEY}`)
// const web3_polygon = new Web3(`wss://rpc.ankr.com/polygon/ws/${process.env.ANKR_KEY}`)
// const web3_solana = new Web3(`wss://rpc.ankr.com/solana/ws/${process.env.ANKR_KEY}`)

// testnet web3
const web3_rpcs_test: RPC[] = [
    {net_id: "1", url: "wss://rpc.ankr.com/eth_goerli/ws/", tokens: [["2", "eth"], ["3", "0x78dEca24CBa286C0f8d56370f5406B48cFCE2f86"]]},
    {net_id: "2", url: "wss://rpc.ankr.com/bsc_testnet_chapel/ws/", tokens: [["5", "eth"], ["3", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"]]},
    {net_id: "4", url: "wss://rpc.ankr.com/polygon_mumbai/ws/", tokens: [["3", "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832"]]},
    {net_id: "5", url: "wss://rpc.ankr.com/optimism_testnet/ws/", tokens: [["9", "0x4200000000000000000000000000000000000042"]]},
    {net_id: "8", url: "wss://rpc.ankr.com/solana_devnet/ws/", tokens: [["7", "eth"]]},
    // "wss://rpc.ankr.com/arbitrum/ws/",
]
// const web3_eth_test = new Web3("wss://eth-goerli.nodereal.io/ws/v1/bea47c70d3ad400ebf95f7d12662fc12")
// const web3_bsc_test = new Web3("wss://bsc-testnet.nodereal.io/ws/v1/5d2c31fcd272410e986c2343bdadee45")

// const web3_eth_test = new Web3(`wss://rpc.ankr.com/eth_goerli/ws/${process.env.ANKR_KEY}`)
// const web3_bsc_test = new Web3(`wss://rpc.ankr.com/bsc_testnet_chapel/ws/${process.env.ANKR_KEY}`)
// const web3_arbitrum_test = new Web3(`wss://rpc.ankr.com/arbitrum/ws/${process.env.ANKR_KEY}`)
// const web3_optimism_test = new Web3(`wss://rpc.ankr.com/optimism_testnet/ws/${process.env.ANKR_KEY}`)
// const web3_polygon_test = new Web3(`wss://rpc.ankr.com/polygon_mumbai/ws/${process.env.ANKR_KEY}`)
// const web3_solana_test = new Web3(`wss://rpc.ankr.com/solana_devnet/ws/${process.env.ANKR_KEY}`)

web3_rpcs_test.map((rpc: RPC, index: number) => {
    // const web3_static = new Web3(rpc.url.replace("wss", "https").concat(process.env.ANKR_KEY as string));
    const web3_static = new Web3('https://rpc.ankr.com/bsc_testnet_chapel/37c6154886e5db365c84f60a21bb9e19834458378c8c17b47bb487d530cf2faf');

    const request = '{"id": 1, "method": "eth_subscribe", "params": ["newPendingTransactions"]}';  

    const ws = new WebSocket(`${rpc.url}${process.env.ANKR_KEY}`);

    ws.on('open', function open() {
        ws.send(request);
    });
    ws.on('message', function incoming(data) {
        // console.log(data);
        const res = JSON.parse(data as string)
        if (res.result != null) {
            // console.log(`Subscription: ${res.result}`);
        } else if (res.params != null && res.params["result"] != null) {
            // console.log(`New pending transaction: ${res.params['result']}`);
            (async () => {
                const txInfo = await web3_static.eth.getTransaction(res.params['result']);
                if (txInfo != null) {
                    // console.log(txInfo);
                    const decode_result = decoder.decodeData(txInfo.input);
                    if((decode_result.method === null && rpc.tokens.flatMap(a => a).includes("eth")) || (decode_result.method !==null && decode_result?.method === "transfer" && rpc.tokens.flatMap(a => a).includes(txInfo?.to as string))) {
                        const to_address = decode_result && decode_result?.method === "transfer" ? decode_result.inputs[0] : txInfo?.to
                        const amount = decode_result && decode_result?.method === "transfer" ? web3_static.utils.fromWei(decode_result.inputs[1].toString(), "ether") : web3_static.utils.fromWei(txInfo.value, "ether")
                        const wallet = await dynamoDBDocumentClient.scan({
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
                        }).then((response: any) => response.Items[0]??[])

                        console.log(to_address);
                        console.log(amount);
                        console.log(rpc.net_id);
                        console.log(wallet)
            
                        if(wallet && wallet.public_key) {
                            // const amount_ether_decimal = web3_static.utils.fromWei(txInfo.value, "ether")
            
                            const deposit = {
                                user: wallet.user_id,
                                amount: amount,
                                asset: decode_result.method === null ? rpc.tokens[0][0] : rpc.tokens.filter(a => a[1] === txInfo.to)[0],
                                net: rpc.net_id,
                                time: Date.now()
                            }
            
                            console.log(deposit);
            
                            snsClient.send(new PublishCommand({
                                TopicArn: process.env.ASSET_STREAM_TOPIC as string,
                                Message: JSON.stringify(deposit)
                            }))
                        }
                        else {
                            console.log('Not ours!')
                        }
                    }
                }
            })();
        } else {
            console.log(`Unexpected: ${data}`);
        }
    });

    /** usdt, usdc subscription using web3
    const web3 = new Web3(`${rpc.url}${process.env.ANKR_KEY}`)
    let options = {
        topics: [
            web3.utils.sha3('Transfer(address,address,uint256)')
        ]
    };
    
    const subscription = web3.eth.subscribe('logs', options, function(error: any, result: any){
        if (!error)
            return null
    });
    
    subscription.on('data', async (event: any) => {
        if (event.topics.length === 3) {
            let transaction = web3.eth.abi.decodeLog([{
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
            }],
            event.data,
            [event.topics[1], event.topics[2]]);
    
            if(tokens_bsc_test.includes(event.address)) {
                const contract = new web3.eth.Contract(abi, event.address)
    
                async function collectData(contract: any) {
                    const [decimals, symbol] = await Promise.all([
                        contract.methods.decimals().call(),
                        contract.methods.symbol().call()
                    ]);
                    return { decimals, symbol };
                }
    
                await collectData(contract).then(({ decimals, symbol }) => {
                    transaction.decimals = decimals
                    transaction.symbol = symbol
                })
    
                console.log(transaction);
    
                const wallet = await dynamoDBDocumentClient.scan({
                    TableName: "CryptoWallets",
                    FilterExpression: "#address = :address AND #net_id = :net_id",
                    ExpressionAttributeNames: {
                        "#address": "public_key",
                        "#net_id": "net_id"
                    },
                    ExpressionAttributeValues: {
                        ":address": transaction?.to,
                        ":net_id": (index+1).toString()
                    }
                    // Key: {
                    //     "public_key": transaction?.to,
                    //     "net_id": "2"
                    // }
                }).then((response: any) => response.Items[0]??[])
    
                console.log(wallet)
    
                if(wallet && wallet.public_key) {
                    const amount_ether_decimal = web3.utils.fromWei(transaction.value, "mwei")
    
                    const deposit = {
                        user: wallet.user_id,
                        amount: amount_ether_decimal,
                        asset: transaction.symbol,
                        net: wallet.net_id,
                        type: "deposit"
                    }
    
                    console.log(deposit);
    
                    snsClient.send(new PublishCommand({
                        TopicArn: process.env.ASSET_STREAM_TOPIC as string,
                        Message: JSON.stringify(deposit)
                    }))
                }
            }
        }
    })
    */
});
