***Crypto 455 Wallet Platform***

**1. High-level Description**

Our project is a crypto wallet platform for cryptocurrencies. We envision it to be a place for experienced crypto traders, and beginners alike to discover and monitor cryptocurrencies in real time, maintaining an investment portfolio and helping to keep track of your (simulated) crypto investments over time! Thanks for checking out our project! :)

**2. Feature Goals:**

*Minimal*
- [x] View real time price of cryptocurrencies.
- [x] View current portfolio

*Standard*
- [x] Tables to get more information about top cryptocurrencies
- [x] Store user and portfolio information in dynamoDB and RDS Mysql
- [x] Deployment to AWS
- [x] Graph Visualization in real time of cryptocurrency prices
- [x] WebSockets connection to Kraken API and Coinbase API for pulling the latest crypto data

*Stretch*
- [x] AWS Lambda, SNS, SQS; Serverless
- [ ] Historical portfolio value
- [x] AWS EC2 automated deployment via GitHub and AWS CodeDeploy
- [ ] 2FA/MFA

Release Engineering

Our application is deployed using AWS. This is in contrast to the course suggestion to use Heroku for a few reasons, such as: we are already using various AWS services for hosting our APIs so it is quite seamless to use AWS for deployment, also that since it's on our own virtual machine there are no start-up times, while using Heroku for the assignment we noticed significant start up times.

Due to our project structure being in a monorepo, it would have been much harder to have everything run from a single build script. This is one of the reasons why we chose to use AWS over others. AWS CodeDeploy gives us the flexibility to configure our deployments to our virtual machines on EC2 in a granular manner, which allows us to independently deploy each module of our app on their own. Although there was some setup required with integrating our GitHub repository with AWS CodeDeploy, the freedom that it gave us with automated deployments outweighed the initial configuration required.

For our application codebase, we chose to use a mono-repo rather than a many-repo because our code-base is quite small, also some of us on the team are working full-stack so it is easier for them to access the entire code-base this way. In addition, we wanted to reduce dependency hell as much as possible, commonly associated with many-repos.

Overall using Git and AWS for release engineering has an important purpose in creating a production-level full-stack web application, since they help address issues such as managing and building maintainable code, and making collaboration among contributors easier, which is important when scaling the application.

We achieved these aspects by separating the various "parts", or features, of our app into separate microservices, which allows them to be scaled much more easily (with the help of AWS).

With lots of data from real-time prices, as well as pushing data from 3rd party APIs to all of our connected users, we knew that with Express running on a single Virtual Machine to serve all our routes, obtain price updates, process open trades, and maintain Websocket connections, we wouldn't be able to scale well, so we decided to use various AWS services in order to effectively scale our app. These include AWS API Gateway (for both Websockets and REST endpoints), AWS Lambda, SNS, SQS, and DynamoDB.

AWS API Websocket Gateway - the main advantage here is it provides us with AWS-managed Websocket connections, which allows us to easily scale to as many ws connections as needed, and makes things more adaptable to burst loads.

AWS Lambda - besides Express, this is the bread and butter of our app: it processes requests in parallel, and more importantly scales to as many requests as we need through the invocation of individual functions for every API request that is received.

AWS SNS + SQS - decoupling our price updates from processing, allows for pub-sub and fan-out processing of our ingested 3rd party data.

Price updates - these are pushed to users via a persistent Websocket connection, so there isn't a need to periodically poll our APIs, which would introduce slight latency.

Network requests - we optimized these through the use of API Gateway, which proxies requests to AWS Lambda, and automatically handles load balancing both when a request is received as well as through the use of AWS Lambda.

Databases - We migrated to using MongoDB only for data that doesn't change often, like user data and portfolio metadata, and we instead chose to have frequently updated data with a specialized, low-latency database, which in this case was AWS DynamoDB, which allows for efficient parallel processing of data.

Static assets - With a single Virtual Machine, high loads can degrade the performance of the entire app, which is why we are serving most of our frontend assets through a CDN (AWS CloudFront) backed by optimized asset storage (AWS S3). This provides not only with scaling and low-latency requests via AWS' peering network, but also has caching built in, allowing us to take load off our key services like price updates processing.

Furthermore, we also have automated deployment configured via AWS CodePipeline and CodeDeploy, which defines a pipeline to update our served assets and price-handling code on EC2 whenever updates are pushed to a GitHub branch. The contained appspec.yml file defines how our code is deployed, and makes deployment time quicker due to continuous deployment.

**AWS S3 upload**
 aws s3 cp ./build/zip s3://destination/ --recursive