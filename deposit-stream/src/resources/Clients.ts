import { SNSClient } from "@aws-sdk/client-sns"
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"

export const snsClient = new SNSClient({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    }
})

export const dynamoDBDocumentClient = DynamoDBDocument.from(
    new DynamoDBClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        }
    }),
    {
        marshallOptions: {
            removeUndefinedValues: true
        }
    }
)