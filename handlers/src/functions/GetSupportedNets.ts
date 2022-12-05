import { dynamoDBDocumentClient } from "../resources/Clients"

export async function handler(event: any) {
    const response = await dynamoDBDocumentClient.scan({
        TableName: "Net"
    })
    
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            'Content-Type': 'application/json'
        },
        body: JSON.stringify((response.Items ?? []).sort((item1, item2) => item1.sort - item2.sort))
    }
}
