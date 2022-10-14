import cors from "cors"
import express from "express"
import routesHandler from "./routes/index"
import CreatePortfolioHandler from "./handlers/CreatePortfolioHandler"
import DefaultDatabaseProxy from "./database/DefaultDatabaseClient"
import GetPortfolioHandler from "./handlers/GetPortfolioHandler"
import * as Config from 'dotenv'

Config.config()

const corsOption = {
    origin: ['http://localhost:3000'],
};

const app = express()
app.use(cors(corsOption));
app.use(express.json())

const port = process.env.CRYPTO_TRADING_PLATFORM_PORT as string
console.log("Port-----", process.env.MONGO_URL as string)
const database = new DefaultDatabaseProxy()
routesHandler(app)

app.get("/", async (request, response) => {
    response.send("Hello World").end()
})

app.post("/CreatePortfolio", async (request, response) => {
    const handler = new CreatePortfolioHandler(database)
    handler.handleRequest(request.body)
        .then(createPortfolioResponse => response.status(200).json(createPortfolioResponse))
        .catch(errorResponse => response.status(400).json(errorResponse))
})

app.post("/ListPortfolios", async (request, response) => {
    const handler = new GetPortfolioHandler(database)
    handler.handleRequest(request.body)
        .then(listPortfolioResponse => response.status(200).json(listPortfolioResponse))
        .catch(errorResponse => response.status(400).json(errorResponse))
})

app.get("/GetSupportedAssets", async (request, response) => {
    // const handler = new GetPortfolioHandler(database)
    // handler.handleRequest(request.body)
    //     .then(createPortfolioResponse => response.status(200).json(createPortfolioResponse))
    //     .catch(errorResponse => response.status(400).json(errorResponse))
    response.status(200).json(["BTC", "ETH", "DOGE"])
})

app.get("/GetSupportedCurrencies", async (request, response) => {
    // const handler = new GetPortfolioHandler(database)
    // handler.handleRequest(request.body)
    //     .then(createPortfolioResponse => response.status(200).json(createPortfolioResponse))
    //     .catch(errorResponse => response.status(400).json(errorResponse))
    response.status(200).json(["USD"])
})

app.listen(port, async () => {
    return console.log(`server is listening on ${port}`)
})
