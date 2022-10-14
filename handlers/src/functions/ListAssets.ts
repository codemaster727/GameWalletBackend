import { getEventBody } from "../resources/Utils"
import { dynamoDBDocumentClient } from "../resources/Clients"
import { Asset } from "../../../server/src/data/Asset"
import { ListUserRequest } from "../../../server/src/requests/ListUserRequest"

export async function handler(event: any) {
    const request: ListUserRequest = getEventBody(event)
    
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
        body: JSON.stringify(response.Items as Asset[] ?? [])
    }
}
