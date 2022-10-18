import { getEventBody } from "../resources/Utils"
import { dynamoDBDocumentClient } from "../resources/Clients"

export async function handler(event: any) {
    const request = getEventBody(event)
    
    const response = await dynamoDBDocumentClient.scan({
        TableName: "CryptoBalances",
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
        body: JSON.stringify(response.Items ?? [])
    }
}
