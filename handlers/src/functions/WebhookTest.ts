import { dynamoDBDocumentClient } from "../resources/Clients"
import { generateId, getEventBody } from "../resources/Utils"

export async function handler(event: any) {
    const request = getEventBody(event);
    const user = {
        id: generateId(),
        request: JSON.stringify(request),
        created_at: Date.now(),
    };
    await dynamoDBDocumentClient.put({
        TableName: "Test",
        Item: user
    });
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            success: true,
        })
    };
}
