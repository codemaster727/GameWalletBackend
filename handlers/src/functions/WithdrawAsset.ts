import { WithdrawAssetResponse } from "../../../server/src/responses/WithdrawAssetResponse"
import { generateConditionExpression, generateId, getEventBody } from "../resources/Utils"
import { WithdrawAssetRequest } from "../../../server/src/requests/WithdrawAssetRequest"
import { dynamoDBDocumentClient } from "../resources/Clients"
import Decimal from "decimal.js"
import Web3 from "web3"
import { UserToken } from "../../../server/src/data/UserToken"
const ABI = require('../abi/ERC20.abi.json');

type RPC = {
    net_id: string
    url: string
    tokens: string[][]
}

export async function handler(event: any) {
    // const request = Utils_1.getEventBody(event);
    const request = {
        "user": "1",
        "net": "2",
        "asset": "5",
        "amount": 0.01,
        "receiver": "0x0fbd6e14566A30906Bc0c927a75b1498aE87Fd43"
    }
    // if (request.authorization === undefined || request.authorization === "") {
    //     return {
    //         statusCode: 200,
    //         body: JSON.stringify({
    //             success: false,
    //             error: "Invalid Credentials"
    //         })
    //     }
    // }
    
    // const authorization = await dynamoDBDocumentClient.get({
    //     TableName: "CryptoUserTokens",
    //     Key: {
    //         "token": request.authorization
    //     }
    // }).then(response => response.Item as UserToken ?? undefined)
    
    // if (authorization === undefined || authorization.user !== request.user) {
    //     return {
    //         statusCode: 200,
    //         body: JSON.stringify({
    //             success: false,
    //             error: "Invalid Credentials"
    //         })
    //     }
    // }
    
    if (Number.isNaN(request.amount)) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: false,
                error: "Invalid Amount"
            })
        }
    }
    
    // const portfolio = dynamoDBDocumentClient.get({
    //     TableName: "CryptoPortfolios",
    //     Key: {
    //         "user": request.user,
    //         "id": request.portfolio
    //     }
    // })
    
    // if (await portfolio.then(response => response.Item) === undefined) {
    //     return {
    //         success: false,
    //         error: "Invalid Portfolio"
    //     }
    // }
    
    const asset = dynamoDBDocumentClient.get({
        TableName: "CryptoAssets",
        Key: {
            "user_id": request.user,
            "token_id": request.asset
        }
    })

    const previousAmount = await asset.then(response => response.Item)
        .then(asset => asset?.amount ?? "0")
        .then(amount => new Decimal(amount))
    const withdrawAmount = new Decimal(request.amount)
    const totalAmount = previousAmount.minus(withdrawAmount)

    console.log(previousAmount);
    
    if (withdrawAmount.isNegative() || withdrawAmount.isZero()) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: false,
                error: "Invalid Amount"
            })
        }
    }
    
    if (totalAmount.isNegative()) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: false,
                error: "Insufficient Balance"
            })
        }
    }

    //mainnet web3
    const web3_rpcs: RPC[] = [
        {net_id: "1", url: "https://rpc.ankr.com/eth/", tokens: [["2", "eth"], ["3", "0xdac17f958d2ee523a2206206994597c13d831ec7"], ["4", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"]]},
        {net_id: "2", url: "https://rpc.ankr.com/bsc/", tokens: [["5", "eth"], ["3", "0x55d398326f99059fF775485246999027B3197955"], ["4", "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"]]},
        {net_id: "3", url: "https://rpc.ankr.com/arbitrum/", tokens: [["2", "eth"]]},
        {net_id: "4", url: "https://rpc.ankr.com/polygon/", tokens: [["3", "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"], ["4", "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"]]},
        {net_id: "5", url: "https://rpc.ankr.com/optimism/", tokens: [["9", "0x4200000000000000000000000000000000000042"]]},
        {net_id: "8", url: "https://rpc.ankr.com/solana/", tokens: [["7", "eth"]]},
    ]

    // testnet web3
    const web3_rpcs_test: RPC[] = [
        {net_id: "1", url: "https://rpc.ankr.com/eth_goerli/", tokens: [["2", "eth"], ["3", "0x78dEca24CBa286C0f8d56370f5406B48cFCE2f86"]]},
        {net_id: "2", url: "https://rpc.ankr.com/bsc_testnet_chapel/", tokens: [["5", "eth"], ["3", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"]]},
        {net_id: "4", url: "https://rpc.ankr.com/polygon_mumbai/", tokens: [["3", "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832"]]},
        {net_id: "5", url: "https://rpc.ankr.com/optimism_testnet/", tokens: [["9", "0x4200000000000000000000000000000000000042"]]},
        {net_id: "8", url: "https://rpc.ankr.com/solana_devnet/", tokens: [["7", "eth"]]},
    ]

    const { PRIVATE_KEY, FROM_ADDRESS, ANKR_KEY } = process.env;
    const accountFrom = {
        privateKey: PRIVATE_KEY as string,
        address: FROM_ADDRESS as string,
    };
    const addressTo = request.receiver; // Change addressTo
    const web3_url = web3_rpcs_test.filter(rpc => rpc.net_id === request.net)[0]?.url.concat(ANKR_KEY as string)
    const web3 = new Web3(web3_url);
    console.log(web3);

    let send = null;
    if (["1", "2", "5", "6", "7", "8"].includes(request.asset)) {
        console.log("eth");
        send = async () => {
            const nonce = await web3.eth.getTransactionCount(accountFrom?.address, 'latest');
        
            console.log(`Attempting to send transaction from ${accountFrom.address} to ${addressTo}`);
        
            // 4. Sign tx with PK
            const createTransaction = await web3.eth.accounts.signTransaction(
                {
                    gas: 21000,
                    to: addressTo,
                    value: web3.utils.toWei('0.001', 'ether'),
                    nonce: nonce,
                },
                accountFrom.privateKey
            );  
        
            // 5. Send tx and wait for receipt
            const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction as string);
            return createReceipt.transactionHash;
        };
    }
    else {
        console.log("none eth");
        send = async () => {
            const token_addr = web3_rpcs_test.filter(rpc => rpc.net_id === request.net)[0]?.tokens.filter(a => a[0] === request.asset)[0][1]
            console.log(token_addr);
            const tokenInst = new web3.eth.Contract(ABI, token_addr);
            const result = await tokenInst.methods.transfer(addressTo, web3.utils.toWei(request.amount.toString())).send({from: accountFrom.address, gas: 100000})
            console.log(result);
            return !(result.error);
        }
    }

    // 6. Call send function
    send().then(async result => {
        if (result) {
            console.log(`Transaction successful with hash: ${result}`);
            const conditionExpression = generateConditionExpression(
                "#amount",
                "=",
                ":previousAmount",
                previousAmount.isZero() ? undefined : previousAmount.toString()
            )
            
            if (totalAmount.isZero()) {
                await dynamoDBDocumentClient.delete({
                    TableName: "CryptoAssets",
                    Key: {
                        "user_id": request.user,
                        "token_id": request.asset
                    },
                    ConditionExpression: conditionExpression,
                    ExpressionAttributeNames: {
                        "#amount": "amount"
                    },
                    ExpressionAttributeValues: {
                        ":previousAmount": previousAmount.toString()
                    }
                })
            } else if (totalAmount.isPositive()) {
                await dynamoDBDocumentClient.update({
                    TableName: "CryptoAssets",
                    Key: {
                        "user_id": request.user,
                        "token_id": request.asset
                    },
                    ConditionExpression: conditionExpression,
                    UpdateExpression: "SET #amount = :totalAmount",
                    ExpressionAttributeNames: {
                        "#amount": "amount"
                    },
                    ExpressionAttributeValues: {
                        ":previousAmount": previousAmount.toString(),
                        ":totalAmount": totalAmount.toString()
                    }
                })
            }
            
            const withdrawal = {
                id: generateId(),
                user_id: request.user,
                net_id: request.net,
                token_id: request.asset,
                amount: request.amount,
                time: Date.now()
            }
            
            await dynamoDBDocumentClient.put({
                TableName: "CryptoWithdrawals",
                Item: withdrawal
            })
            
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    withdrawal: withdrawal
                })
            }
        }
        else {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: false,
                    error: "Tx failed unexpectedly"
                })
            }
        }
    })
}
