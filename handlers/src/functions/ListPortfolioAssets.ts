import { getEventBody } from "../resources/Utils"
import { dynamoDBDocumentClient } from "../resources/Clients"
import { Asset } from "../../../server/src/data/Asset"
import { ListPortfolioAssetsRequest } from "../../../server/src/requests/ListPortfolioAssetsRequest"

export async function handler(event: any) {
    const request = getEventBody(event) as ListPortfolioAssetsRequest
    
    const response = await dynamoDBDocumentClient.scan({
        TableName: "CryptoAssets",
        FilterExpression: "#portfolio = :portfolio",
        ExpressionAttributeNames: {
            "#portfolio": "portfolio"
        },
        ExpressionAttributeValues: {
            ":portfolio": request.portfolio
        }
    })
    
    return {
        statusCode: 200,
        body: JSON.stringify(response.Items ?? [])
    }
}
