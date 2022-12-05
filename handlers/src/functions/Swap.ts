import { generateConditionExpression, generateId, getEventBody } from "../resources/Utils";
import Decimal from "decimal.js";
import { dynamoDBDocumentClient, assetStreamClient } from "../resources/Clients"
import { PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi"
import { textEncoder } from "../resources/Tools"

export async function handler(event: any) {
  const request = getEventBody(event);
  
  if (!request) {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: "Invalid Data",
      }),
    };
  }

  const tokens = await dynamoDBDocumentClient.scan({
    TableName: "CryptoSupportedAssets",
  })
  .then((response: any) => response.Items ?? []);

  const fromToken = tokens.find(
    (t: any) => request.fromToken === t.id
  );
  const toToken = tokens.find(
    (t: any) => request.toToken === t.id
  );

  const fromPrice = await dynamoDBDocumentClient.get({
    TableName: "CryptoData",
    Key: {
      asset: fromToken.name.concat('-USD'),
    },
  })
  .then(response => response?.Item);

  const toPrice = await dynamoDBDocumentClient.get({
    TableName: "CryptoData",
    Key: {
      asset: toToken.name.concat('-USD'),
    },
  })
  .then(response => response?.Item);

  if (!fromPrice || !toPrice) {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: "No Price Data",
      }),
    };
  }

  const fromAsset = dynamoDBDocumentClient.get({
    TableName: "CryptoAssets",
    Key: {
      user_id: request.user_id,
      token_id: fromToken.id,
    },
  });

  const toAsset = dynamoDBDocumentClient.get({
    TableName: "CryptoAssets",
    Key: {
      user_id: request.user_id,
      token_id: toToken.id,
    },
  });

  const previousFromAmount = await fromAsset
    .then((response) => response.Item)
    .then((asset) => asset?.amount ?? "0")
    .then((amount) => new Decimal(amount));

  const fromAmount = new Decimal(request.fromAmount);
  const nextFromAmount = previousFromAmount.minus(fromAmount);

  if (nextFromAmount.isNegative() || nextFromAmount.isZero()) {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: "Invalid fromAmount",
      }),
    };
  }

  const previousToAmount = await toAsset
    .then((response) => response.Item)
    .then((asset) => asset?.amount ?? "0")
    .then((amount) => new Decimal(amount));

  // const toAmount = new Decimal(request.toAmount);
  const rate = new Decimal(fromPrice?.price).div(new Decimal(toPrice?.price));
  const toAmount = rate.mul(fromAmount)

  if (new Decimal(request.toAmount).minus(toAmount).abs().div(toAmount).gt(0.05)) {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: "Price has changed a lot",
      }),
    };
  }

  const nextToAmount = previousToAmount.plus(toAmount);

  if (nextToAmount.isNegative() || nextToAmount.isZero()) {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: "Invalid toAmount",
      }),
    };
  }



  const conditionFromExpression = generateConditionExpression(
    "#amount",
    "=",
    ":previousAmount",
    previousFromAmount.isZero() ? undefined : previousFromAmount.toString()
  );

  const conditionToExpression = generateConditionExpression(
    "#amount",
    "=",
    ":previousAmount",
    previousToAmount.isZero() ? undefined : previousToAmount.toString()
  );

  const updateExpression = "SET #amount = :totalAmount";

  await dynamoDBDocumentClient.update({
    TableName: "CryptoAssets",
    Key: {
      user_id: request.user_id,
      token_id: fromToken.id,
    },
    ConditionExpression: conditionFromExpression,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: {
      "#amount": "amount",
    },
    ExpressionAttributeValues: {
      ":previousAmount": previousFromAmount.isZero()
        ? undefined
        : previousFromAmount.toString(),
      ":totalAmount": nextFromAmount.toString(),
    },
  });

  await dynamoDBDocumentClient.update({
    TableName: "CryptoAssets",
    Key: {
      user_id: request.user_id,
      token_id: toToken.id,
    },
    ConditionExpression: conditionToExpression,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: {
      "#amount": "amount",
    },
    ExpressionAttributeValues: {
      ":previousAmount": previousToAmount.isZero()
        ? undefined
        : previousToAmount.toString(),
      ":totalAmount": nextToAmount.toString(),
    },
  });

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      success: true,
      swapData: request,
    }),
  };
}
