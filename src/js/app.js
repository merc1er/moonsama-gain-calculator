import Alpine from 'alpinejs'

/*material ids correspond to token id
https://moonsama.com/token/ERC1155/0x1b30a3b5744e733d8d2f19f0812e3f79152a8777/10
^token id is last part of URL
*/
const materials = [{"tokenId": 1, "name":"wood"}, {"tokenId": 2, "name":"stone"}, {"tokenId": 3, "name":"iron"}, {"tokenId": 4, "name":"gold"}, {"tokenId": 5, "name":"experience"}, {"tokenId": 10, "name":"grain"}]


/**
 * @typedef {Object} MaterialResult
 * @property {number} tokenId - id of token
 * @property {string} name - name of token
 * @property {number} lowestSell
 * @property {number} highestBuy
 */

/**
 * Returns prices, tokenIds, and names for all minecraft NFTs
 * @returns {Promise<MaterialResult[]>}
 */
async function getAllMaterialsMovr(){
  const proms = []
  let rawResult = [];
  for(const material of materials){
    const prom = getMaterialMovr(material.tokenId)
    proms.push(prom)
    prom.then(({lowestSell, highestBuy})=>{
      rawResult.push({tokenId: material.tokenId, name: material.name, lowestSell, highestBuy})
    })
  }
  await Promise.all(proms)
  rawResult = rawResult.sort((a, b) => a.tokenId - b.tokenId)


  const result = {
    wood: rawResult[0],
    stone: rawResult[1],
    iron: rawResult[2],
    gold: rawResult[3],
    exp: rawResult[4],
    grain: rawResult[5],
  }
  return result
}


/**
 * Returns the price in MOVR of token
 * @param {number} tokenId
 * @returns {Promise<{lowestSell: number, highestBuy: number}>}
 */
async function getMaterialMovr(tokenId){
  const graphqlQuery =
`query getAssetOrders {
  sells: orders(where: {active: true, sellAsset: "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777-${tokenId}"}) {
    sellAsset {
      id
    }
    askPerUnitNominator
    askPerUnitDenominator
  },
  buys: orders(where: {active: true, buyAsset: "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777-${tokenId}"}) {
    buyAsset {
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
  const buys = responseJson.data.buys.map(buy => buy.askPerUnitDenominator/buy.askPerUnitNominator).sort((a, b) => a-b)
  const sells = responseJson.data.sells.map(sell => sell.askPerUnitNominator/sell.askPerUnitDenominator).sort((a, b) => a-b)

  const lowestSell = sells.shift()
  const highestBuy = buys.pop()

  return {lowestSell, highestBuy}
}


/**
 * Returns the total USD value of all resources
 * @param {Dict} resources
 * @param {Dict} prices
 * @param {Float} price of MOVR token in USD: movrPrice
 * @returns {totalBuyMovr: number, totalBuyUsd: number, totalSellMovr: number, totalSellUsd: number}
 */
function getTotal(resources, prices, movrPrice){
  const woodValueBuy = resources.wood * prices.wood.highestBuy
  const stoneValueBuy = resources.stone * prices.stone.highestBuy
  const ironValueBuy = resources.iron * prices.iron.highestBuy
  const expValueBuy = resources.exp * prices.exp.highestBuy
  const grainValueBuy = resources.grain * prices.grain.highestBuy
  const goldValueBuy = resources.gold * prices.gold.highestBuy

  const woodValueSell = resources.wood * prices.wood.lowestSell
  const stoneValueSell = resources.stone * prices.stone.lowestSell
  const ironValueSell = resources.iron * prices.iron.lowestSell
  const expValueSell = resources.exp * prices.exp.lowestSell
  const grainValueSell = resources.grain * prices.grain.lowestSell
  const goldValueSell = resources.gold * prices.gold.lowestSell

  const totalBuyMovr = woodValueBuy + stoneValueBuy + ironValueBuy + expValueBuy + grainValueBuy + goldValueBuy
  const totalBuyUsd = totalBuyMovr * movrPrice

  const totalSellMovr = woodValueSell + stoneValueSell + ironValueSell + expValueSell + grainValueSell + goldValueSell
  const totalSellUsd = totalSellMovr * movrPrice
  return {totalBuyMovr: totalBuyMovr.toFixed(2), totalBuyUsd: totalBuyUsd.toFixed(2), totalSellMovr: totalSellMovr.toFixed(2), totalSellUsd: totalSellUsd.toFixed(2)}
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


/**
 * Add thousands separators
 * @param {Number}
 * @returns {String}
 */
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Make the following functions accessible from AlpineJS
window.getAllMaterialsMovr = getAllMaterialsMovr
//load material quote on page load
window.getAllMaterialsMovrFailed = false 
const getAllMaterialsMovrPromise = getAllMaterialsMovr()
getAllMaterialsMovrPromise.catch(()=>{
  window.getAllMaterialsMovrFailed = true
})
window.getAllMaterialsMovrPromise = getAllMaterialsMovrPromise
window.getTotal = getTotal
window.formatDate = formatDate
window.formatDateApi = formatDateApi
window.carnageDates = carnageDates
window.numberWithCommas = numberWithCommas

// Load Alpine
window.Alpine = Alpine
Alpine.start()
