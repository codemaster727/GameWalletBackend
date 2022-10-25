import { getEventBody } from "../resources/Utils"
import { dynamoDBDocumentClient } from "../resources/Clients"
import { ListPortfoliosRequest } from "../../../server/src/requests/ListPortfoliosRequest"

export async function handler(event: any) {
    const request = event.queryStringParameters;
    
    const response = await dynamoDBDocumentClient.scan({
        TableName: "CryptoWallets",
        FilterExpression: "#user = :user",
        ExpressionAttributeNames: {
            "#user": "user_id"
        },
        ExpressionAttributeValues: {
            ":user": request.user
        }
    })

    const wallets = response.Items?.flatMap(item => {
        return {
            net_id: item.net_id,
            address: item.public_key
        }
    }) ?? []
    
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(wallets)
    }
}
