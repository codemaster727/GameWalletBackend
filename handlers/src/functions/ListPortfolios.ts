import { getEventBody } from "../resources/Utils"
import { dynamoDBDocumentClient } from "../resources/Clients"
import { ListPortfoliosRequest } from "../../../server/src/requests/ListPortfoliosRequest"

export async function handler(event: any) {
    const request = getEventBody(event) as ListPortfoliosRequest
    
    const response = await dynamoDBDocumentClient.scan({
        TableName: "CryptoPortfolios",
        FilterExpression: "#user = :user",
        ExpressionAttributeNames: {
            "#user": "user"
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
