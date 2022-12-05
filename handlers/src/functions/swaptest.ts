import LIFI from '@lifi/sdk';

const config = {
  apiUrl: 'https://li.quest/v1/',
};

const app = new LIFI(config)

const routesRequest = {
  fromChainId: 5,
  fromAmount: '1000000000000000000',
  fromTokenAddress: '0x0000000000000000000000000000000000000000',
  toChainId: 5,
  toTokenAddress: '0xb5B640E6414b6DeF4FC9B3C1EeF373925effeCcF',
};

const callFunc = async () => {
  const chains = await app.getChains();
  console.log(chains);
  // const routesResponse = await app.getRoutes(routesRequest);
  // console.log(routesResponse);
}

callFunc()