const axios = require('axios');

var khaosSubgraphQueries = {
  all_pairs_query: "query MyQuery($resources_addresses: [String!]) {tokens {pairQuote {token0 {id symbol} \ntoken1 {id \nsymbol} \ntoken0Price \ntoken1Price}}}",
  rss_usdc_pair_query: "query MyQuery($resources_addresses: [String!]) {tokens {pairQuote(where: {token0_: {symbol_in: $resources_symbols}, token1_: {symbol: \"USDC\"}}) {token0 {\nid\nsymbol}token1 {id symbol}\ntoken0Price\ntoken1Price}}}",
  rss_sama_pair_query: "query MyQuery($resources_addresses: [String!]) { tokens { pairQuote(where: {token0_in: $resources_addresses, token1: \"0x8c992cba48189a79204223d106fcb1d797a5f87a\"}) { token0 { id symbol } token1 { id symbol } token0Price token1Price } }}",
  usdc_sama_pair_query: "query MyQuery { tokens { pairQuote(where: {token0: \"0x765277eebeca2e31912c9946eae1021199b39c61\", token1: \"0x8c992cba48189a79204223d106fcb1d797a5f87a\"}) { token0 { id symbol } token1 { id symbol } token0Price token1Price } }}"
};

async function getUSDPriceOfSama() {
  let url = 'https://graph.khaos.exchange/subgraphs/name/exosama-dex';
  let headers = {
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,it;q=0.6',
    'Connection': 'keep-alive',
    'Origin': 'https://analytics.khaos.exchange',
    'Referer': 'https://analytics.khaos.exchange/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'accept': '*/*',
    'content-type': 'application/json',
    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
  };
  let queryString = khaosSubgraphQueries.usdc_sama_pair_query; 

  var sama_price = -1;
  const response = await performQuery(url, null, headers, queryString);
  const data = response.data.data.tokens; 
  for (let i=0; i < data.length; i++ ) {
    if (data[i].pairQuote.length != 0) {
      sama_price = data[i].pairQuote[0].token0Price;
    }
  }
  console.log(sama_price);
  return sama_price; 
}

async function getUSDPriceOfRss() {
  let url = 'https://graph.khaos.exchange/subgraphs/name/exosama-dex';
  let headers = {
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,it;q=0.6',
    'Connection': 'keep-alive',
    'Origin': 'https://analytics.khaos.exchange',
    'Referer': 'https://analytics.khaos.exchange/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'accept': '*/*',
    'content-type': 'application/json',
    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
  };
  let queryString = khaosSubgraphQueries.rss_sama_pair_query; 
  let variables = { resources_addresses: ["0x549ab43056e3489335b47927ffcd4825ce484ba3", "0x122ebe2b679cf54bc8a6e89c1009714b354e2d10", "0x0528ae6c997ba4ffc4d6add898a2cc9f26d4a872", "0x829191fec0f25a27c5bdcdbbd0e37e6342b39945"] };
  
  let sama_usd_price = await getUSDPriceOfSama();
  var rss_prices_usd = {};
  const response = await performQuery(url, variables, headers, queryString);
  let data = response.data.data.tokens; 
  for (i=0; i < data.length; i++ ) {
    if (data[i].pairQuote.length != 0) {
      for (j=0; j < data[i].pairQuote.length; j++ ) {
        let rss_name = data[i].pairQuote[j].token0.symbol; 
        rss_prices_usd[rss_name] = data[i].pairQuote[j].token1Price * sama_usd_price; 
      }
    }
  }
  console.log(rss_prices_usd)
  return rss_prices_usd; 
}
  
async function performQuery(url, variables, headers, queryString) {
  const response = await axios.post(
    url,
    {
        'variables': variables,
        'query': queryString 
    },
    {
        headers
    }
  );
  return response; 
}

export { getUSDPriceOfRss, getUSDPriceOfSama }; 