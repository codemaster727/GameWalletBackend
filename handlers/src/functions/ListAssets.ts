import { getEventBody } from "../resources/Utils"
import { dynamoDBDocumentClient } from "../resources/Clients"
import { Asset } from "../../../server/src/data/Asset"
import { ListUserRequest } from "../../../server/src/requests/ListUserRequest"

export async function handler(event: any) {
    const request: ListUserRequest = event.queryStringParameters;
    
    const response = await dynamoDBDocumentClient.scan({
        TableName: "CryptoAssets",
        FilterExpression: "#user = :user",
        ExpressionAttributeNames: {
            "#user": "user_id"
        },
        ExpressionAttributeValues: {
            ":user": request.user
        }
    })
    
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(response.Items as Asset[] ?? [])
    }
}
