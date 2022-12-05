import WebSocket from "ws"
import { PublishCommand } from "@aws-sdk/client-sns"
import { PriceData } from "./data/PriceData"
import { snsClient } from "./resources/Clients"
import axios from "axios"
import { Token } from "../../server/src/data/Token"


const updateInterval = 1000 * 2
const updateIntervalLast = 1000
const lastUpdateTimes = new Map()

lastUpdateTimes.set("last", 0)

let coinbaseOpened = false
let streamerOpened = false

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const reconnectCoinbase = async () => {
    await sleep(5000)
    createConnectionCoinbase()
}

const createConnectionCoinbase = () => {
    const connection = new WebSocket("wss://ws-feed.exchange.coinbase.com")
    connection.on("open", async () => {
        coinbaseOpened = true
        const supportedCurrencyPairs = (await getSupportedCurrencyPairs()).concat(["USDT-EUR"])
        supportedCurrencyPairs.forEach(pair => lastUpdateTimes.set(pair, 0))
        const message = {"type": "subscribe", "channels": [{"name": "ticker", "product_ids": supportedCurrencyPairs}]}
        console.log(JSON.stringify(message));
        connection.send(JSON.stringify(message));
        // setTimeout(() => {
        //     connection.terminate()
        // }, 5000);
    })
    
    connection.on("message", (data: any) => {
        [data]
            .filter(update => typeof update === "string")
            .map(update => update as string)
            .map(update => JSON.parse(update))
            .filter(update => update.type === "ticker" && update.price)
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
            .forEach(async (update: PriceData) => {
                console.log(update);
                if (update.time > Math.max(lastUpdateTimes.get(update.asset) + updateInterval, 0)) {
                    lastUpdateTimes.set(update.asset, update.time)
                    lastUpdateTimes.set("last", update.time)
                    if(process.env.AWS_REGION) {
                        await snsClient.send(new PublishCommand({
                            TopicArn: process.env.DATA_STREAM_TOPIC as string,
                            Message: JSON.stringify(update)
                        }))
                    }
                }
            })
    })
    
    connection.on("close", (data: any) => {
        coinbaseOpened = false
        console.log("closed: ", data);
        connection.terminate()
        reconnectCoinbase()
    })
    
    connection.on("error", (data: any) => {
        // coinbaseOpened = false
        // console.log("error: ", data);
        // reconnectCoinbase()
    })
}

createConnectionCoinbase();

const connection_for_bnb = new WebSocket("wss://streamer.cryptocompare.com/v2?api_key=" + process.env.Api_Key)

connection_for_bnb.on("open", async () => {
    lastUpdateTimes.set("BNB-USD", 0)
    // lastUpdateTimes.set("BNB-EUR", 0)
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
        .forEach(async (update: PriceData) => {
            if (update.time > Math.max(lastUpdateTimes.get(update.asset) + updateInterval, 0)) {
                lastUpdateTimes.set(update.asset, update.time)
                lastUpdateTimes.set("last", update.time)
                if(process.env.AWS_REGION) {
                    await snsClient.send(new PublishCommand({
                        TopicArn: process.env.DATA_STREAM_TOPIC as string,
                        Message: JSON.stringify(update)
                    }))
                }
            }
        })
})

async function getSupportedCurrencyPairs(): Promise<string[]> {
    const supportedAssets: Token[] = await axios.get("https://4zcsu9v606.execute-api.eu-west-1.amazonaws.com/GetSupportedAssets").then(response => response.data)
    // const supportedCurrencies: string[] = await axios.get("https://4zcsu9v606.execute-api.eu-west-1.amazonaws.com/GetSupportedCurrencies").then((response: any) => response.data)
    return supportedAssets.flatMap(asset => ["USD"].map(currency => `${asset.name}-${currency}`))
}

async function getBNBCurrencyPairs(): Promise<string[]> {
    const supportedAssets: string[] = ["BNB"]
    // const supportedCurrencies: string[] = await axios.get("https://4zcsu9v606.execute-api.eu-west-1.amazonaws.com/GetSupportedCurrencies").then((response: any) => response.data)
    return supportedAssets.flatMap(asset => ["USD"].map(currency => `5~CCCAGG~${asset}~${currency}`))
}
