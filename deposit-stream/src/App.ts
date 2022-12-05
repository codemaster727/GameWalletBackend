import { PublishCommand } from "@aws-sdk/client-sns";
import { snsClient, dynamoDBDocumentClient } from "./resources/Clients";
import InputDataDecoder from 'ethereum-input-data-decoder';
import WebSocket from "ws";

const new_account_ws_url = "";
const ws = new WebSocket(new_account_ws_url);

ws.onmessage = (message) => {
    console.log(message);
    const res = JSON.parse(message.data.toString())
    if (res.params && res.params["result"]) {
        (async () => {
            snsClient.send(new PublishCommand({
                TopicArn: process.env.ASSET_STREAM_TOPIC as string,
                Message: JSON.stringify(deposit)
            }))
        })
    }
};
