"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const client_sns_1 = require("@aws-sdk/client-sns");
const Clients_1 = require("./resources/Clients");
const axios_1 = __importDefault(require("axios"));
const updateInterval = 1000 * 2;
const updateIntervalLast = 1000;
const lastUpdateTimes = new Map();
lastUpdateTimes.set("last", 0);
let coinbaseOpened = false;
let streamerOpened = false;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const reconnectCoinbase = async () => {
    await sleep(5000);
    createConnectionCoinbase();
};
const createConnectionCoinbase = () => {
    const connection = new ws_1.default("wss://ws-feed.exchange.coinbase.com");
    connection.on("open", async () => {
        coinbaseOpened = true;
        const supportedCurrencyPairs = (await getSupportedCurrencyPairs()).concat(["USDT-EUR"]);
        supportedCurrencyPairs.forEach(pair => lastUpdateTimes.set(pair, 0));
        const message = { "type": "subscribe", "channels": [{ "name": "ticker", "product_ids": supportedCurrencyPairs }] };
        console.log(JSON.stringify(message));
        connection.send(JSON.stringify(message));
        // setTimeout(() => {
        //     connection.terminate()
        // }, 5000);
    });
    connection.on("message", (data) => {
        [data]
            .filter(update => typeof update === "string")
            .map(update => update)
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
            .forEach(async (update) => {
            console.log(update);
            if (update.time > Math.max(lastUpdateTimes.get(update.asset) + updateInterval, 0)) {
                lastUpdateTimes.set(update.asset, update.time);
                lastUpdateTimes.set("last", update.time);
                if (process.env.AWS_REGION) {
                    await Clients_1.snsClient.send(new client_sns_1.PublishCommand({
                        TopicArn: process.env.DATA_STREAM_TOPIC,
                        Message: JSON.stringify(update)
                    }));
                }
            }
        });
    });
    connection.on("close", (data) => {
        coinbaseOpened = false;
        console.log("closed: ", data);
        connection.terminate();
        reconnectCoinbase();
    });
    connection.on("error", (data) => {
        // coinbaseOpened = false
        // console.log("error: ", data);
        // reconnectCoinbase()
    });
};
createConnectionCoinbase();
const connection_for_bnb = new ws_1.default("wss://streamer.cryptocompare.com/v2?api_key=" + process.env.Api_Key);
connection_for_bnb.on("open", async () => {
    lastUpdateTimes.set("BNB-USD", 0);
    // lastUpdateTimes.set("BNB-EUR", 0)
    const supportedCurrencyPairs = await getBNBCurrencyPairs();
    var message = {
        "action": "SubAdd",
        "subs": supportedCurrencyPairs
    };
    connection_for_bnb.send(JSON.stringify(message));
});
connection_for_bnb.on("message", (data) => {
    [data]
        .filter((update) => typeof update === "string")
        .map(update => update)
        .map(update => (JSON.parse(update)))
        .filter((update) => update.TYPE === "5" && update.PRICE)
        .map((update) => ({
        asset: update.FROMSYMBOL + "-" + update.TOSYMBOL,
        price: update.PRICE.toString(),
        source: "CCCAGG",
        // volume: update.VOLUME24HOUR,
        time: Date.now()
    }))
        .forEach(async (update) => {
        if (update.time > Math.max(lastUpdateTimes.get(update.asset) + updateInterval, 0)) {
            lastUpdateTimes.set(update.asset, update.time);
            lastUpdateTimes.set("last", update.time);
            if (process.env.AWS_REGION) {
                await Clients_1.snsClient.send(new client_sns_1.PublishCommand({
                    TopicArn: process.env.DATA_STREAM_TOPIC,
                    Message: JSON.stringify(update)
                }));
            }
        }
    });
});
async function getSupportedCurrencyPairs() {
    const supportedAssets = await axios_1.default.get("https://4zcsu9v606.execute-api.eu-west-1.amazonaws.com/GetSupportedAssets").then(response => response.data);
    // const supportedCurrencies: string[] = await axios.get("https://4zcsu9v606.execute-api.eu-west-1.amazonaws.com/GetSupportedCurrencies").then((response: any) => response.data)
    return supportedAssets.flatMap(asset => ["USD"].map(currency => `${asset.name}-${currency}`));
}
async function getBNBCurrencyPairs() {
    const supportedAssets = ["BNB"];
    // const supportedCurrencies: string[] = await axios.get("https://4zcsu9v606.execute-api.eu-west-1.amazonaws.com/GetSupportedCurrencies").then((response: any) => response.data)
    return supportedAssets.flatMap(asset => ["USD"].map(currency => `5~CCCAGG~${asset}~${currency}`));
}
