import { generateConditionExpression, generateId } from "../resources/Utils"
import { dynamoDBDocumentClient } from "../resources/Clients"
import Decimal from "decimal.js"

export async function handler(event: any) {
    const request = JSON.parse(event.Records[0].Sns.Message)

    if (!request) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: false,
                error: "Invalid Data"
            })
        }
    }
    
    if (Number.isNaN(request.amount)) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: false,
                error: "Invalid Amount"
            })
        }
    }

    const asset = dynamoDBDocumentClient.get({
        TableName: "CryptoAssets",
        Key: {
            "user_id": request.user,
            "token_id": request.asset
        }
    })
    
    const previousAmount = await asset.then(response => response.Item)
        .then(asset => asset?.amount ?? "0")
        .then(amount => new Decimal(amount))
    const depositAmount = new Decimal(request.amount)
    const totalAmount = previousAmount.plus(depositAmount)
    
    if (depositAmount.isNegative() || depositAmount.isZero()) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: false,
                error: "Invalid Amount"
            })
        }
    }
    
    const conditionExpression = generateConditionExpression(
        "#amount",
        "=",
        ":previousAmount",
        previousAmount.isZero() ? undefined : previousAmount.toString()
    )
    
    const updateExpression = "SET #amount = :totalAmount"
    
    await dynamoDBDocumentClient.update({
        TableName: "CryptoAssets",
        Key: {
            "user_id": request.user,
            "token_id": request.asset
        },
        ConditionExpression: conditionExpression,
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: {
            "#amount": "amount"
        },
        ExpressionAttributeValues: {
            ":previousAmount": previousAmount.isZero() ? undefined : previousAmount.toString(),
            ":totalAmount": totalAmount.toString()
        }
    })
    
    const deposit = {
        id: generateId(),
        user_id: request.user,
        net_id: request.net,
        token_id: request.asset,
        amount: request.amount,
        time: request.time
    }

    await dynamoDBDocumentClient.put({
        TableName: "CryptoDeposits",
        Item: deposit
    })

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            deposit: deposit
        })
    }
}
