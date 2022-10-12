import { generateId, getEventBody } from "../resources/Utils"
import { dynamoDBDocumentClient } from "../resources/Clients"
import { CreatePortfolioResponse } from "../../../server/src/responses/CreatePortfolioResponse"
import Web3 from 'web3'
// import { generateAccount } from "../resources/Utils"

export function generateAccount(): any {
    const web3 = new Web3(process.env.RPC_URL as string)
    return web3.eth.accounts.create()
}

export async function handler(event: any) {
    const request = getEventBody(event)
    
    const portfolio = {
        id: generateId(),
        user: request.user,
        name: request.name
    }
    
    await dynamoDBDocumentClient.put({
        TableName: "CryptoPortfolios",
        Item: portfolio
    })
    
    const account = generateAccount()

    const wallet = {
        portfolio: portfolio.id,
        user: portfolio.user,
        net: "BSC",
        address: account.address,
        key: account.privateKey
    }

    await dynamoDBDocumentClient.put({
        TableName: "CryptoWallets",
        Item: wallet
    })

    return {
        statusCode: 200,
        body: JSON.stringify({...portfolio, wallet: {net: wallet.net}})
    }
}
