import CreateUserResponse from "../../../server/src/responses/CreateUserResponse"
import { generateId, generatePasswordHash, getEventBody } from "../resources/Utils"
import { CreateUserRequest } from "../../../server/src/requests/CreateUserRequest"
import { dynamoDBDocumentClient } from "../resources/Clients"
import { User } from "../../../server/src/data/User"
import { UserCredentials } from "../../../server/src/data/UserCredentials"
import { UserToken } from "../../../server/src/data/UserToken"

export async function handler(event: any) {
    const request = getEventBody(event) as CreateUserRequest
    
    const user: User = {
        id: generateId(),
        email: request.email,
        name: request.name
    }
    
    const response = await dynamoDBDocumentClient.scan({
        TableName: "CryptoUsers",
        // IndexName: "CryptoUsersEmailIndex",
        FilterExpression: "#email = :email",
        ExpressionAttributeNames: {
            "#email": "email"
        },
        ExpressionAttributeValues: {
            ":email": request.email
        }
    }).then(response => response.Items as User[] ?? [])
    
    if (response.length > 0) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: false,
                error: "User already exists"
            })
        }
    }
    
    await dynamoDBDocumentClient.put({
        TableName: "CryptoUsers",
        Item: user
    })
    
    const credentials: UserCredentials = {
        user: user.id,
        password: await generatePasswordHash(request.password)
    }
    
    await dynamoDBDocumentClient.put({
        TableName: "CryptoUserCredentials",
        Item: credentials
    })
    
    const token: UserToken = {
        user: user.id,
        token: generateId()
    }
    
    await dynamoDBDocumentClient.put({
        TableName: "CryptoUserTokens",
        Item: token
    })
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            user: user.id,
            token: token.token
        })
    }
}
