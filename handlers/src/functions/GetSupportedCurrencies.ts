import { dynamoDBDocumentClient } from "../resources/Clients"

export async function handler(event: any) {
    const response = await dynamoDBDocumentClient.scan({
        TableName: "CryptoSupportedCurrencies"
    })
    
    return {
        statusCode: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify((response.Items ?? []).map(item => item?.name))
    }
}
