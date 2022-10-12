import WebSocket from "ws"
import { PublishCommand } from "@aws-sdk/client-sns"
import { PriceData } from "./data/PriceData"
import { snsClient } from "./resources/Clients"
import axios from "axios"

const connection = new WebSocket("wss://ws-feed.pro.coinbase.com")
const updateInterval = 1000 * 2
const updateIntervalLast = 100
const lastUpdateTimes = new Map()
const lastUpdateTimesBNB = new Map()

lastUpdateTimes.set("last", 0)

connection.on("open", async () => {
    const supportedCurrencyPairs = await getSupportedCurrencyPairs()
    supportedCurrencyPairs.forEach(pair => lastUpdateTimes.set(pair, 0))
    const message = {"type": "subscribe", "channels": [{"name": "ticker", "product_ids": supportedCurrencyPairs}]}
    connection.send(JSON.stringify(message))
})

connection.on("message", (data: any) => {
    [data]
        .filter(update => typeof update === "string")
        .map(update => update as string)
        .map(update => JSON.parse(update))
        .filter(update => update.type === "ticker")
        .map(update => ({
            source: "Coinbase",
            asset: update.product_id,
            price: update.price,
            // open: update.open_24h,
            // high: update.high_24h,
            // low: update.low_24h,
            // volume: update.volume_24h,
            time: Date.now()
        }))
        .forEach((update: PriceData) => {
            if (update.time > Math.max(lastUpdateTimes.get(update.asset) + updateInterval, lastUpdateTimes.get("last") + updateIntervalLast)) {
                lastUpdateTimes.set(update.asset, update.time)
                lastUpdateTimes.set("last", update.time)
                snsClient.send(new PublishCommand({
                    TopicArn: process.env.DATA_STREAM_TOPIC as string,
                    Message: JSON.stringify(update)
                }))
            }
        })
})

const connection_for_bnb = new WebSocket("wss://streamer.cryptocompare.com/v2?api_key=" + process.env.Api_Key)

connection_for_bnb.on("open", async () => {
    lastUpdateTimesBNB.set("BNB-USD", 0)
    lastUpdateTimesBNB.set("BNB-EUR", 0)
    const supportedCurrencyPairs = await getBNBCurrencyPairs()
    var message = {
        "action": "SubAdd",
        "subs": supportedCurrencyPairs
    };
    connection_for_bnb.send(JSON.stringify(message))
})

connection_for_bnb.on("message", (data: any) => {
    [data]
        .filter((update: string) => typeof update === "string")
        .map(update => update as string)
        .map(update => (JSON.parse(update)))
        .filter((update: any) => update.TYPE === "5" && update.PRICE)
        .map((update: any) => ({
            asset: update.FROMSYMBOL + "-" + update.TOSYMBOL,
            price: update.PRICE.toString(),
            source: "CCCAGG",
            // volume: update.VOLUME24HOUR,
            time: Date.now()
        }))
        .forEach((update: PriceData) => {
            if (update.time > Math.max(lastUpdateTimesBNB.get(update.asset) + updateInterval, lastUpdateTimes.get("last") + updateIntervalLast)) {
                lastUpdateTimesBNB.set(update.asset, update.time)
                snsClient.send(new PublishCommand({
                    TopicArn: process.env.DATA_STREAM_TOPIC as string,
                    Message: JSON.stringify(update)
                }))
            }
        })
})

async function getSupportedCurrencyPairs(): Promise<string[]> {
    const supportedAssets: string[] = await axios.get("https://t1ku4pvu63.execute-api.eu-west-1.amazonaws.com/default/GetSupportedAssets").then(response => response.data)
    const supportedCurrencies: string[] = await axios.get("https://t1ku4pvu63.execute-api.eu-west-1.amazonaws.com/default/GetSupportedCurrencies").then(response => response.data)
    return supportedAssets.flatMap(asset => supportedCurrencies.map(currency => `${asset}-${currency}`))
}

async function getBNBCurrencyPairs(): Promise<string[]> {
    const supportedAssets: string[] = ["BNB"]
    const supportedCurrencies: string[] = await axios.get("https://t1ku4pvu63.execute-api.eu-west-1.amazonaws.com/default/GetSupportedCurrencies").then(response => response.data)
    return supportedAssets.flatMap(asset => supportedCurrencies.map(currency => `5~CCCAGG~${asset}~${currency}`))
}
