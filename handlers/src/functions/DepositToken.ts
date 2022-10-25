import { generateConditionExpression, generateId } from "../resources/Utils"
import { dynamoDBDocumentClient } from "../resources/Clients"
import Decimal from "decimal.js"

export async function handler(event: any) {
    const request = JSON.parse(event.Records[0].Sns.Message)
    // const request = {"hash":"0x7d49a60e3e26e02c2ed315e0eb123216c9d526ac54bfefd6a59156f78deca8e7","gas":"21000","gasPrice":"46719536202","nonce":"172","input":"0x","transactionIndex":"139","fromAddress":"0x775808cb53f5f419fe22e7c7bf48234c88628192","toAddress":"0x775808cb53f5f419fe22e7c7bf48234c88628192","value":"10000000000000","type":"2","v":"0","r":"87140225145848601411075880929369468188693374221829103449947565891441161662559","s":"36195842966622358044585997305921151636801281900485740501947973778165979064836","receiptCumulativeGasUsed":"21555884","receiptGasUsed":"21000","receiptContractAddress":null,"receiptRoot":null,"receiptStatus":"1"}

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
    });



    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            deposit: deposit
        })
    }
}
