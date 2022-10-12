import { ListTradesResponse } from "../../../server/src/responses/ListTradesResponse"
import { getEventBody } from "../resources/Utils"
import { ListTradesRequest } from "../../../server/src/requests/ListTradesRequest"
import { dynamoDBDocumentClient } from "../resources/Clients"
import { Trade } from "../../../server/src/data/Trade"
import { UserToken } from "../../../server/src/data/UserToken"

export async function handler(event: any) {
    const request = getEventBody(event) as ListTradesRequest
    
    if (request.authorization === undefined || request.authorization === "") {
        return {
            statusCode: 200,
            body: JSON.stringify([])
        }
    }
    
    const authorization = await dynamoDBDocumentClient.get({
        TableName: "CryptoUserTokens",
        Key: {
            "token": request.authorization
        }
    }).then(response => response.Item as UserToken ?? undefined)
    
    if (authorization === undefined || authorization.user !== request.user) {
        return {
            statusCode: 200,
            body: JSON.stringify([])
        }
    }
    
    const openTrades = dynamoDBDocumentClient.scan({
        TableName: "CryptoOpenTrades",
        FilterExpression: "#portfolio = :portfolio",
        ExpressionAttributeNames: {
            "#portfolio": "portfolio"
        },
        ExpressionAttributeValues: {
            ":portfolio": request.portfolio
        }
    })
    
    const closedTrades = dynamoDBDocumentClient.scan({
        TableName: "CryptoClosedTrades",
        FilterExpression: "#portfolio = :portfolio",
        ExpressionAttributeNames: {
            "#portfolio": "portfolio"
        },
        ExpressionAttributeValues: {
            ":portfolio": request.portfolio
        }
    })
    
    const cancelledTrades = dynamoDBDocumentClient.scan({
        TableName: "CryptoCancelledTrades",
        FilterExpression: "#portfolio = :portfolio",
        ExpressionAttributeNames: {
            "#portfolio": "portfolio"
        },
        ExpressionAttributeValues: {
            ":portfolio": request.portfolio
        }
    })

    return Promise.all([openTrades, closedTrades, cancelledTrades])
        .then(responses => responses.flatMap(response => response.Items ?? []))
        .then(items => ({
            statusCode: 200,
            body: JSON.stringify(items as Trade[])
        }))
}
