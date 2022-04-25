import Alpine from 'alpinejs'

/*material ids correspond to token id
https://moonsama.com/token/ERC1155/0x1b30a3b5744e733d8d2f19f0812e3f79152a8777/10
^token id is last part of URL
*/
const materials = [{"token_id": 1, "name":"wood"}, {"token_id": 2, "name":"stone"}, {"token_id": 3, "name":"iron"}, {"token_id": 4, "name":"gold"}, {"token_id": 5, "name":"experience"}, {"token_id": 10, "name":"grain"}]


/**
 * @typedef {Object} MaterialResult
 * @property {number} token_id - id of token
 * @property {string} name - name of token
 * @property {number} priceMovr
 */

/**
 * Returns prices, token_ids, and names for all minecraft NFTs
 * @returns {Promise<MaterialResult[]>}
 */
async function getAllMaterialsMovr(){
  const proms = []
  let rawResult = [];
  for(const material of materials){
    const prom = getMaterialMovr(material.token_id)
    proms.push(prom)
    prom.then((priceMovr)=>{
      rawResult.push({token_id: material.token_id, name: material.name, priceMovr})
    })
  }
  await Promise.all(proms)
  rawResult = rawResult.sort((a, b) => a.token_id - b.token_id)

  const result = {
    wood: rawResult[0].priceMovr,
    stone: rawResult[1].priceMovr,
    iron: rawResult[2].priceMovr,
    gold: rawResult[3].priceMovr,
    exp: rawResult[4].priceMovr,
    grain: rawResult[5].priceMovr,
  }
  return result
}


/**
 * Returns the price in MOVR of token
 * @param {number} tokenId
 * @returns {Promise<number>}
 */
async function getMaterialMovr(tokenId){
  const graphqlQuery =
`query getAssetOrders {
  orders(where: {active: true, sellAsset: "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777-${tokenId}"}) {
    sellAsset {
      id
    }
    askPerUnitNominator
    askPerUnitDenominator
  }
}`

  const fetchUrl = "https://moonriver-subgraph.moonsama.com/subgraphs/name/moonsama/marketplacev4"
  const response = await fetch(fetchUrl, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify({query: graphqlQuery})
  });
  const responseJson = await response.json()
  const prices = responseJson.data.orders.map(order => order.askPerUnitNominator/order.askPerUnitDenominator).sort((a, b) => a-b)
  const lowestPrice = prices.shift()
  return lowestPrice
}


/**
 * Returns the total USD value of all resources
 * @param {Dict} resources
 * @param {Dict} prices
 * @param {Float} price of MOVR token in USD: movrPrice
 * @returns {Float}
 */
async function getTotal(resources, prices, movrPrice){
  const woodValue = resources.wood * prices.wood
  const stoneValue = resources.stone * prices.stone
  const ironValue = resources.iron * prices.iron
  const expValue = resources.exp * prices.exp
  const grainValue = resources.grain * prices.grain
  const goldValue = resources.gold * prices.gold

  const totalMovr = woodValue + stoneValue + ironValue + expValue + grainValue + goldValue
  const totalUSD = totalMovr * movrPrice
  return {
    movr: totalMovr.toFixed(2),
    usd: totalUSD.toFixed(2),
  }
}


// Date

/**
 * Make a date more human-readable
 * @param {Date} date: the date that needs to be prettified (3 April 2022 format)
 * @returns {String}
 */
function formatDate(date){
  const options = {year: 'numeric', month: 'long', day: 'numeric'}
  return new Date(date).toLocaleDateString("en-GB", options)
}

/**
 * Format date for api request
 * @param {Date} date: the date that needs to be prettified (yyyy-mm-dd format)
 * @returns {String}
 */
function formatDateApi(date){
  return new Date(date).toISOString().split('T')[0]
}


/**
 * Returns 
 * @returns {number[]}
 */
function carnageDates() {
  //2022-04-03 first date that carnage api has
  const carnageStartTime = 1648947601000;
  let carnageTime = carnageStartTime
  const nowTime = new Date().getTime()
  const dates = [carnageTime];
  while(true){
    carnageTime = carnageTime + 1000 * 60 * 60 * 24 * 7

    if(carnageTime > nowTime){
      break
    }
    dates.push(carnageTime)
  }
  return dates.reverse()
}


// Make the following functions accessible from AlpineJS
window.getAllMaterialsMovr = getAllMaterialsMovr
window.getTotal = getTotal
window.formatDate = formatDate
window.formatDateApi = formatDateApi
window.carnageDates = carnageDates

// Load Alpine
window.Alpine = Alpine
Alpine.start()
