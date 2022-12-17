import Alpine from 'alpinejs'

//carnage resources
const materials = [
{ "chainId": 1285, "assetAddress": "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777", "tokenId": 1, "name": "wood" },
{ "chainId": 1285, "assetAddress": "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777", "tokenId": 2, "name": "stone" },
{ "chainId": 1285, "assetAddress": "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777", "tokenId": 3, "name": "iron" },
{ "chainId": 1285, "assetAddress": "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777", "tokenId": 4, "name": "gold" },
{ "chainId": 1285, "assetAddress": "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777", "tokenId": 5, "name": "experience" },
{ "chainId": 1285, "assetAddress": "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777", "tokenId": 10, "name": "grain" },
{ "chainId": 1285, "assetAddress": "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777", "tokenId": 12, "name": "string" },
{ "chainId": 1285, "assetAddress": "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777", "tokenId": 13, "name": "fish_specimen" },
{ "chainId": 1285, "assetAddress": "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777", "tokenId": 16, "name": "moonstone" },

{ "chainId": 2109, "assetAddress": "0x95370351df734b6a712ba18848b47574d3e90e61", "tokenId": 1, "name": "pumpkins" },
{ "chainId": 2109, "assetAddress": "0x95370351df734b6a712ba18848b47574d3e90e61", "tokenId": 2, "name": "blood_crystals" },
{ "chainId": 2109, "assetAddress": "0x95370351df734b6a712ba18848b47574d3e90e61", "tokenId": 3, "name": "dna" },
{ "chainId": 2109, "assetAddress": "0x95370351df734b6a712ba18848b47574d3e90e61", "tokenId": 4, "name": "mobidium" },
{ "chainId": 2109, "assetAddress": "0x95370351df734b6a712ba18848b47574d3e90e61", "tokenId": 5, "name": "wood" },
{ "chainId": 2109, "assetAddress": "0x95370351df734b6a712ba18848b47574d3e90e61", "tokenId": 6, "name": "stone" },
{ "chainId": 2109, "assetAddress": "0x95370351df734b6a712ba18848b47574d3e90e61", "tokenId": 7, "name": "iron" },
{ "chainId": 2109, "assetAddress": "0x95370351df734b6a712ba18848b47574d3e90e61", "tokenId": 8, "name": "gold" }
]

/**
 * @typedef {Object} MaterialResult
 * @property {number} chainId
 * @property {number} tokenId - id of token 
 * @property {string} name - name of token
 * @property {number} lowestSell
 * @property {number} highestBuy
 */

/**
 * Returns prices, tokenIds, chainIds, and names for all game NFTs
 * @returns {Promise<MaterialResult[]>}
 */
async function getAllMaterialsPrice(){
  let results = await Promise.all(materials.map(async ({chainId, name, tokenId, assetAddress}) => {
    let result
    if(chainId === 1285){
      result = await getMaterialMovr(assetAddress, tokenId)
    }else if(chainId === 2109){
      result = await getMaterialSama(assetAddress, tokenId)
    }
    if(!!result){
      return {chainId, name, tokenId, lowestSell: result.lowestSell, highestBuy: result.highestBuy }
    }
  }))

  results = results.filter(r=> !!r) //filter out results that are not an object

  return results
}


/**
 * Returns the price in MOVR of token
 * @param {number} tokenId
 * @returns {Promise<{lowestSell: number, highestBuy: number}>}
 */
async function getMaterialMovr(assetAddress, tokenId){
  const graphqlQuery =
`query getAssetOrders {
  sells: orders(where: {active: true, sellAsset: "${assetAddress}-${tokenId}", onlyTo: "0x0000000000000000000000000000000000000000"}, orderBy: pricePerUnit, orderDirection: asc, skip: 0, first: 1) {
    sellAsset {
      id
    }
    askPerUnitNominator
    askPerUnitDenominator
  },
  buys: orders(where: {active: true, buyAsset: "${assetAddress}-${tokenId}"}, orderBy: pricePerUnit, orderDirection: desc, skip: 0, first: 1) {
    buyAsset {
      id
    }
    askPerUnitNominator
    askPerUnitDenominator
  }
}`

  const fetchUrl = "https://moonriver-subgraph.moonsama.com/subgraphs/name/moonsama/marketplacev5"
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

  let lowestSell = sells.shift()
  let highestBuy = buys.pop()

  if(isNaN(lowestSell)){
    lowestSell = 0
  }
  if(isNaN(highestBuy)){
    highestBuy = 0
  }
  return {lowestSell, highestBuy}
}


/**
 * Returns the price in MOVR of token
 * @param {number} tokenId
 * @returns {Promise<{lowestSell: number, highestBuy: number}>}
 */
async function getMaterialSama(assetAddress, tokenId){
  const graphqlQuery =
`query getAssetOrders {
  sells: orders(where: {active: true, sellAsset: "${assetAddress}-${tokenId}", onlyTo: "0x0000000000000000000000000000000000000000"}, orderBy: pricePerUnit, orderDirection: asc, skip: 0, first: 1) {
    sellAsset {
      id
    }
    askPerUnitNominator
    askPerUnitDenominator
  },
  buys: orders(where: {active: true, buyAsset: "${assetAddress}-${tokenId}"}, orderBy: pricePerUnit, orderDirection: desc, skip: 0, first: 1) {
    buyAsset {
      id
    }
    askPerUnitNominator
    askPerUnitDenominator
  }
}`

  const fetchUrl = "https://exosama-subgraph.moonsama.com/subgraphs/name/moonsama/marketplacev8"
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

  let lowestSell = sells.shift()
  let highestBuy = buys.pop()

  if(isNaN(lowestSell)){
    lowestSell = 0
  }
  if(isNaN(highestBuy)){
    highestBuy = 0
  }
  return {lowestSell, highestBuy}
}


/**
 * Returns the total USD value of all resources
 * @param {Dict} resources
 * @param {Dict} prices
 * @param {number} gameDate
 * @param {Float} price of MOVR token in USD: movrPrice
 * @param {Float} price of SAMA token in USD: samaPrice
 * @returns {totalBuyMovr: number, totalBuySama: number, totalBuyUsd: number, totalSellMovr: number, totalSellSama: number, totalSellUsd: number}
 */
function getTotal(resources, prices, gameDate, movrPrice, samaPrice){
  console.log("gameDate "+String(gameDate))
  let totalBuyMovr = 0
  let totalSellMovr = 0

  let totalBuySama = 0
  let totalSellSama = 0

  for(const {chainId, tokenId, name} of materials){
    if(resources.hasOwnProperty(name) && !isNaN(parseFloat(resources[name]))){
      const matchingPrice = prices.find(p=> p.chainId === chainId && p.tokenId === tokenId)

      if(chainId === 1285){
        if(!!matchingPrice){
          totalBuyMovr+= resources[name] * matchingPrice.highestBuy
          totalSellMovr+= resources[name] * matchingPrice.lowestSell
        }
      }else if(chainId === 2109){
        if(!!matchingPrice){
          totalBuySama+= resources[name] * matchingPrice.highestBuy
          totalSellSama+= resources[name] * matchingPrice.lowestSell
        }
      }
    }
  }

  const totalBuyUsd = totalBuyMovr * movrPrice + totalBuySama * samaPrice
  const totalSellUsd = totalSellMovr * movrPrice + totalSellMovr * samaPrice
  return {totalBuyMovr: totalBuyMovr.toFixed(3), totalBuySama: totalBuySama.toFixed(3), totalBuyUsd: totalBuyUsd.toFixed(2), totalSellMovr: totalSellMovr.toFixed(3), totalSellSama: totalSellSama.toFixed(3), totalSellUsd: totalSellUsd.toFixed(2)}
}


// Date

/**
 * Make a date more human-readable
 * @param {Date} date: the date that needs to be prettified (3 April 2022 format)
 * @returns {String}
 */
function formatDate(date){
  //keep time zone in UTC so date shows carnage dates as reflected on moonsama website
  const options = {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'}
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
 * Capitalize and rename resources for human friendly display
 * @param {String}
 * @returns {String}
 */
function prettifyResource(resource){
  let res = resource

  if(res === "fish_specimen"){
    res = "fish"
  }

  return res.trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())))
}


/**
 * @returns {number[]}
 */
function carnageDates() {
  //2022-04-03 first date that carnage api has, game finishes at 6pm UTC
  const carnageStartTime = 1649008800000
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

/**
 * Gets valid resources
 * @param {Object}
 * @returns {String[]}
 */
function getValidResources(resources) {
  const validResources = []
    for(const [resource, value] of Object.entries(resources)){
      if(!isNaN(parseFloat(value))){
        validResources.push(resource)
      }
    }
    return validResources.sort()
}

// Make the following functions accessible from AlpineJS
window.getAllMaterialsPrice = getAllMaterialsPrice
//load material quote on page load
window.getAllMaterialsPriceFailed = false 
const getAllMaterialsPricePromise = getAllMaterialsPrice()
getAllMaterialsPricePromise.catch(()=>{
  window.getAllMaterialsPricePromise = true
})
window.getAllMaterialsPricePromise = getAllMaterialsPricePromise
window.getTotal = getTotal
window.formatDate = formatDate
window.formatDateApi = formatDateApi
window.carnageDates = carnageDates
window.numberWithCommas = numberWithCommas
window.getValidResources = getValidResources
window.prettifyResource = prettifyResource
// Load Alpine
window.Alpine = Alpine
Alpine.start()
