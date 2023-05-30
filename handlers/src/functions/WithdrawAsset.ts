import { WithdrawAssetResponse } from "../../../server/src/responses/WithdrawAssetResponse"
import { generateConditionExpression, generateId, getEventBody, removePrefix } from "../resources/Utils"
import { WithdrawAssetRequest } from "../../../server/src/requests/WithdrawAssetRequest"
import { assetStreamClient, dynamoDBDocumentClient, snsClient } from "../resources/Clients"
import Decimal from "decimal.js"
import Web3 from "web3"
import path from 'path'
import cjson from 'cjson'
import Common from 'ethereumjs-common';
import bs58 from 'bs58'
import * as web3_sol from '@solana/web3.js'
// get the client
import mysql from 'mysql2/promise';
import { AddTransactionsRequest } from "../../../server/src/requests/ListTransactionsRequest"
import { PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi"
import { textEncoder } from "../resources/Tools"
import { PublishCommand } from "@aws-sdk/client-sns"
const TX = require('ethereumjs-tx').Transaction;

const ABI = require('../abi/ERC20.abi.json');

type RPC = {
    net_id: string
    url: string
    tokens: string[][]
}

let prevNonce: number = 0;
// let count: number = 0;

export async function handler(event: any) {
    const request = getEventBody(event);
    // count++;
    // const request = {
    //     "user": "1",
    //     "net": "1",
    //     "asset": "2",
    //     "amount": 0.0003,
    //     // "receiver": "4KyYVQbhMHXuTMNJaQQxj5KyVHYJ4cKgcGmYeWPZUUrZ" // SOL address
    //     "receiver": "0x0fbd6e14566A30906Bc0c927a75b1498aE87Fd43" // ERC20 address
    // }
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
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Content-Type': 'application/json'
            },
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

    if (withdrawAmount.isNegative() || withdrawAmount.isZero()) {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: "Invalid Amount"
            })
        }
    }
    
    if (totalAmount.isNegative()) {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: "Insufficient Balance"
            })
        }
    }

    const wallet = await dynamoDBDocumentClient
    .scan({
      TableName: "CryptoWallets",
      FilterExpression: "#user = :user AND #net_id = :net_id",
      ExpressionAttributeNames: {
        "#user": "user_id",
        "#net_id": "net_id",
      },
      ExpressionAttributeValues: {
        ":user": request.user,
        ":net_id": request.net,
      },
    })
    .then((response: any) => response.Items[0] ?? null);
    console.log(wallet);

    //mainnet web3
    const web3_rpcs: RPC[] = [
        {net_id: "1", url: "https://rpc.ankr.com/eth/", tokens: [["2", "eth"], ["3", "0xdac17f958d2ee523a2206206994597c13d831ec7"], ["4", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"]]},
        {net_id: "2", url: "https://rpc.ankr.com/bsc/", tokens: [["5", "eth"], ["3", "0x55d398326f99059fF775485246999027B3197955"], ["4", "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"]]},
        {net_id: "3", url: "https://rpc.ankr.com/arbitrum/", tokens: [["2", "eth"]]},
        {net_id: "4", url: "https://rpc.ankr.com/polygon/", tokens: [["3", "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"], ["4", "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"]]},
        {net_id: "5", url: "https://rpc.ankr.com/optimism/", tokens: [["9", "0x4200000000000000000000000000000000000042"]]},
        {net_id: "9", url: "https://rpc.ankr.com/solana/", tokens: [["7", "eth"]]}, // https://mainnet.neonevm.org	
    ]

    // testnet web3
    const web3_rpcs_test: RPC[] = [
        {net_id: "1", url: "https://goerli.infura.io/v3/e2e27cf1335c43beb497124f3d140bf2", tokens: [["1", "eth"], ["3", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"], ["4", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"]]},
        {net_id: "2", url: "https://bsc-testnet.nodereal.io/v1/5d2c31fcd272410e986c2343bdadee45", tokens: [["5", "eth"], ["3", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"], ["4", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"]]},
        {net_id: "4", url: "https://rpc-mumbai.maticvigil.com/", tokens: [["3", "0x2d7882beDcbfDDce29Ba99965dd3cdF7fcB10A1e"], ["4", "0x2d7882beDcbfDDce29Ba99965dd3cdF7fcB10A1e"]]}, //https://rpc-mumbai.matic.today
        {net_id: "5", url: "https://goerli.optimism.io/", tokens: [["9", "0x4200000000000000000000000000000000000042"]]},
        {net_id: "9", url: "https://api.devnet.solana.com/", tokens: [["7", "eth"]]}, // https://proxy.devnet.neonlabs.org/solana https://devnet.neonevm.org
    ]

    const chainIds = [
        {net_id: "1", chain_id: "1", name: "mainnet"},
        {net_id: "2", chain_id: "56", name: "bsctest"},
        {net_id: "3", chain_id: "42161", name: "arbitrum"},
        {net_id: "4", chain_id: "137", name: "polygon"},
        {net_id: "5", chain_id: "10", name: "optimism"},
        {net_id: "9", chain_id: "245022934", name: "solana"},
    ];

    const chainIds_test = [
        {net_id: "1", chain_id: "5", name: "goerli"},
        {net_id: "2", chain_id: "97", name: "bsctest"},
        {net_id: "4", chain_id: "80001", name: "mumbai"},
        {net_id: "5", chain_id: "420", name: "goerli optimism"},
        {net_id: "9", chain_id: "245022926", name: "solana test"},
    ];

    const { PRIVATE_KEY, FROM_ADDRESS, ANKR_KEY, SOL_PRIVATE_KEY, SOL_FROM_ADDRESS } = process.env;
    // const accountFrom = {
    //     private_key: PRIVATE_KEY as string,
    //     public_key: FROM_ADDRESS as string,
    // };
    const accountFrom = wallet;
    const addressTo = request.receiver; // Change addressTo
    const web3_url = web3_rpcs_test.filter(rpc => rpc.net_id === request.net)[0]?.url// .concat(ANKR_KEY as string)
    const web3 = new Web3(web3_url);

    const send = async (): Promise<any> => {
        if (["1", "2", "5", "6", "8"].includes(request.asset)) {
            const nonce = await web3.eth.getTransactionCount(accountFrom?.public_key, 'latest');
            const gasPrice = await web3.eth.getGasPrice()
        
            prevNonce = Math.max(nonce, prevNonce + 1);

            const chain = chainIds_test.find(chain => chain.net_id === request.net)

            const common = Common.forCustomChain('mainnet', {
                name: chain?.name,
                networkId: parseInt(chain?.chain_id as string),
                chainId: parseInt(chain?.chain_id as string)
            }, 'petersburg');

            const txData = {
                gas: 21000,
                gasPrice: web3.utils.toHex(gasPrice), 
                to: addressTo.toLowerCase(),
                value: web3.utils.toHex(web3.utils.toWei(request.amount.toString(), 'ether')),
                nonce: prevNonce,
            };
            // 4. Sign tx with PK
            // const createTransaction = await web3.eth.accounts.signTransaction(
            //     txData,
            //     accountFrom.private_key
            // );
            
            // sign transaction with TX
            const tx = new TX(txData, {common})
            const privateKey = Buffer.from(removePrefix(wallet.private_key), 'hex')
            tx.sign(privateKey)

            // return await sendSigned(tx)
            // async function sendSigned(tx: any) {
                // return new Promise(async function(resolve,reject){
                // send the signed transaction
                return await web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'))
                // .once('transactionHash', function(hash){
                //     return hash;
                // })
                // .then(out => {
                //     return out;
                // })
                // .catch(err => {
                //     // respond with error
                //     console.log(err);
                //     // reject(err)
                //     return err
                // })
                // })
            // }

        
            // 5. Send tx and wait for receipt
            // const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction as string, (error, hash) => {
            //     console.log(error);
            // });
            // console.log(`Transaction successful with hash: ${createReceipt.transactionHash}`);
            // return "result"
        }
        else if (request.asset === "7") {
            const secret_key = bs58.decode(SOL_PRIVATE_KEY as string);
            // Connect to cluster
            const connection = new web3_sol.Connection(web3_sol.clusterApiUrl("devnet"));
            // Construct a `Keypair` from secret key
            const from = web3_sol.Keypair.fromSecretKey(secret_key);
            // Generate a new random public key
            const to = request.receiver;
            // Add transfer instruction to transaction
            const transaction = new web3_sol.Transaction().add(
                web3_sol.SystemProgram.transfer({
                    fromPubkey: from.publicKey,
                    toPubkey: new web3_sol.PublicKey(to),
                    lamports: web3_sol.LAMPORTS_PER_SOL * request.amount,
                })
            );
            // Sign transaction, broadcast, and confirm
            const signature = await web3_sol.sendAndConfirmTransaction(
                connection,
                transaction,
                [from]
            );
            return signature;
        }
        else if (["3", "4"].includes(request.asset)) {
            if (request.net === "7") {
                return null;
            }
            else {
                const token_addr = web3_rpcs_test.find(rpc => rpc.net_id === request.net)?.tokens.filter(a => a[0] === request.asset)[0][1]
                web3.eth.accounts.wallet.add(wallet.private_key);
                const tokenInst = new web3.eth.Contract(ABI, token_addr);
                const result = await tokenInst.methods.transfer(addressTo, web3.utils.toWei(request.amount.toString(), request.net === "1" ? "Mwei" : "ether")).send({from: accountFrom.public_key, gas: 100000})
                console.log("USDT tx: ", result);
                // return !(result.error);
                return result;
            }
        }
        else return null;
    }

    // 6. Call send function
    const result = await send();
    // const remove_result = web3.eth.accounts.wallet.remove(0);
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

        const curr_time = Date.now();
        
        const withdrawal = {
            id: generateId(),
            hash: result.transactionHash,
            user_id: request.user,
            net_id: request.net,
            token_id: request.asset,
            amount: request.amount,
            created_at: curr_time,
            status: "confirmed",
            type: "withdraw",
        }
        
        await dynamoDBDocumentClient.put({
            TableName: "CryptoWithdrawals",
            Item: withdrawal
        })

        const connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PW,
            database: process.env.DATABASE_NAME
          });

        const query = `INSERT INTO ${process.env.DATABASE_NAME} (user_id, hash, address, token_id, net_id, type, amount, state, created_at) VALUES('${request.user}', '${result?.transactionHash}', '${addressTo}', '${request.asset}', '${request.net}', 'withdraw', ${request.amount}, 'success', FROM_UNIXTIME(${curr_time / 1000}))`;
        const [rows, fields] = await connection.execute(query);

        // const response = await dynamoDBDocumentClient.scan({
        //     TableName: "CryptoAssetStreamConnections",
        //     // IndexName: "CryptoTradeStreamConnectionsUserIndex",
        //     // FilterExpression: "#user = :user",
        //     // ExpressionAttributeNames: {
        //     //     "#user": "user"
        //     // },
        //     // ExpressionAttributeValues: {
        //     //     ":user": update.user
        //     // }
        //   });
        // const connections = response?.Items ?? [];

        // for (const connection of connections) {
        //     await assetStreamClient.send(new PostToConnectionCommand({
        //       ConnectionId: connection.connectionId,
        //       Data: textEncoder.encode(JSON.stringify(withdrawal))
        //     })).catch((e) => {
        //       console.log(e);
        //       dynamoDBDocumentClient.delete({
        //         TableName: "CryptoAssetStreamConnections",
        //         Key: {
        //           "connectionId": connection.connectionId
        //         }
        //       })
        //     })
        // }

        await snsClient.send(new PublishCommand({
            TopicArn: process.env.ASSET_STREAM_TOPIC as string,
            Message: JSON.stringify(withdrawal)
        }));
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                withdrawal: withdrawal
            })
        }
    }
    else {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: JSON.stringify(request)
            })
        }
    }
}
