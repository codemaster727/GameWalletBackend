"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const client_sns_1 = require("@aws-sdk/client-sns");
const Clients_1 = require("./resources/Clients");
const axios_1 = __importDefault(require("axios"));
const connection = new ws_1.default("wss://ws-feed.pro.coinbase.com");
const updateInterval = 1000 * 2;
const updateIntervalLast = 100;
const lastUpdateTimes = new Map();
const lastUpdateTimesBNB = new Map();
lastUpdateTimes.set("last", 0);
connection.on("open", async () => {
    const supportedCurrencyPairs = await getSupportedCurrencyPairs();
    supportedCurrencyPairs.forEach(pair => lastUpdateTimes.set(pair, 0));
    const message = { "type": "subscribe", "channels": [{ "name": "ticker", "product_ids": supportedCurrencyPairs }] };
    connection.send(JSON.stringify(message));
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
        .forEach((update) => {
        if (update.time > Math.max(lastUpdateTimes.get(update.asset) + updateInterval, lastUpdateTimes.get("last") + updateIntervalLast)) {
            lastUpdateTimes.set(update.asset, update.time);
            lastUpdateTimes.set("last", update.time);
            console.log(update);
            Clients_1.snsClient.send(new client_sns_1.PublishCommand({
                TopicArn: process.env.DATA_STREAM_TOPIC,
                Message: JSON.stringify(update)
            }));
        }
    });
});
const connection_for_bnb = new ws_1.default("wss://streamer.cryptocompare.com/v2?api_key=" + process.env.Api_Key);
connection_for_bnb.on("open", async () => {
    lastUpdateTimesBNB.set("BNB-USD", 0);
    lastUpdateTimesBNB.set("BNB-EUR", 0);
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
        .forEach((update) => {
        if (update.time > Math.max(lastUpdateTimesBNB.get(update.asset) + updateInterval, lastUpdateTimes.get("last") + updateIntervalLast)) {
            lastUpdateTimesBNB.set(update.asset, update.time);
            lastUpdateTimes.set("last", update.time);
            console.log(update);
            Clients_1.snsClient.send(new client_sns_1.PublishCommand({
                TopicArn: process.env.DATA_STREAM_TOPIC,
                Message: JSON.stringify(update)
            }));
        }
    });
});
async function getSupportedCurrencyPairs() {
    const supportedAssets = await axios_1.default.get("https://4zcsu9v606.execute-api.eu-west-1.amazonaws.com/GetSupportedAssets").then(response => response.data);
    const supportedCurrencies = await axios_1.default.get("https://4zcsu9v606.execute-api.eu-west-1.amazonaws.com/GetSupportedCurrencies").then((response) => response.data);
    return supportedAssets.flatMap(asset => supportedCurrencies.map(currency => `${asset.name}-${currency}`));
}
async function getBNBCurrencyPairs() {
    const supportedAssets = ["BNB"];
    const supportedCurrencies = await axios_1.default.get("https://4zcsu9v606.execute-api.eu-west-1.amazonaws.com/GetSupportedCurrencies").then((response) => response.data);
    return supportedAssets.flatMap(asset => supportedCurrencies.map(currency => `5~CCCAGG~${asset}~${currency}`));
}
