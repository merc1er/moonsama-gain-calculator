import Alpine from 'alpinejs'
import { getUSDPriceOfRss, getUSDPriceOfSama } from './queryprices.js';

/*material ids correspond to token id
https://moonsama.com/token/ERC1155/0x1b30a3b5744e733d8d2f19f0812e3f79152a8777/10
^token id is last part of URL
*/
/* Alpha resource materials (no longer being tracked) */
// const materials = [{"tokenId": 1, "name":"wood"}, {"tokenId": 2, "name":"stone"}, {"tokenId": 3, "name":"iron"}, {"tokenId": 4, "name":"gold"}, {"tokenId": 5, "name":"experience"}, {"tokenId": 10, "name":"grain"}, {"tokenId": 12, "name":"string"}, {"tokenId": 13, "name":"fish_specimen"}, {"tokenId": 16, "name": "moonstone"}]

/* Beta resource materials.
  Beta resources are ERC1155, which are tokens that fall under same address but indexed by ID:
  erce1155address-tokenId.
*/
const materials = [{"tokenId": 1, "name":"pumpkins"}, {"tokenId": 2, "name":"blood_crystals"}, {"tokenId": 3, "name":"dna"}, {"tokenId": 4, "name":"mobidium"}, {"tokenId": 5, "name":"wood"}, {"tokenId": 6, "name":"stone"}, {"tokenId": 7, "name":"iron"}, {"tokenId": 8, "name":"gold"}]
const erc1155address = "0x95370351df734b6a712ba18848b47574d3e90e61";

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
 * @deprecated Use sama network
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
    string: rawResult[6],
    fish_specimen: rawResult[7],
    moonstone: rawResult[8]
  }
  console.log(result)
  return result
}


/**
 * Returns the price in MOVR of token
 * @param {number} tokenId
 * @returns {Promise<{lowestSell: number, highestBuy: number}>}
 * @deprecated Use sama network
 */
async function getMaterialMovr(tokenId){
  const graphqlQuery =
`query getAssetOrders {
  sells: orders(where: {active: true, sellAsset: "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777-${tokenId}", onlyTo: "0x0000000000000000000000000000000000000000"}, orderBy: pricePerUnit, orderDirection: asc, skip: 0, first: 1) {
    sellAsset {
      id
    }
    askPerUnitNominator
    askPerUnitDenominator
  },
  buys: orders(where: {active: true, buyAsset: "0x1b30a3b5744e733d8d2f19f0812e3f79152a8777-${tokenId}"}, orderBy: pricePerUnit, orderDirection: desc, skip: 0, first: 1) {
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
 * Returns prices, tokenIds, and names for all minecraft NFTs
 * @returns {Promise<MaterialResult[]>}
 */
async function getAllMaterialsSama(){
  const proms = []
  let rawResult = [];
  for(const material of materials){
    const prom = getMaterialSama(material.tokenId)
    proms.push(prom)
    prom.then(({lowestSell, highestBuy})=>{
      rawResult.push({tokenId: material.tokenId, name: material.name, lowestSell, highestBuy})
    })
  }
  await Promise.all(proms)
  rawResult = rawResult.sort((a, b) => a.tokenId - b.tokenId)


  const result = {
    pumpkins: rawResult[0],
    blood_crystals: rawResult[1],
    dna: rawResult[2],
    mobidium: rawResult[3],
    wood: rawResult[4],
    stone: rawResult[5],
    iron: rawResult[6],
    gold: rawResult[7]
  }
  console.log(result)
  return result
}


/**
 * Returns the price in SAMA of a token sourced by marketplace.moonsama.com
 * @param {number} tokenId
 * @returns {Promise<{lowestSell: number, highestBuy: number}>}
 */
async function getMaterialSama(tokenId){
  const graphqlQuery =
`query getAssetOrders {
  sells: orders(where: {active: true, sellAsset: "${erc1155address}-${tokenId}", onlyTo: "0x0000000000000000000000000000000000000000"}, orderBy: pricePerUnit, orderDirection: asc, skip: 0, first: 1) {
    sellAsset {
      id
    }
    askPerUnitNominator
    askPerUnitDenominator
  },
  buys: orders(where: {active: true, buyAsset: "${erc1155address}-${tokenId}"}, orderBy: pricePerUnit, orderDirection: desc, skip: 0, first: 1) {
    buyAsset {
      id
    }
    askPerUnitNominator
    askPerUnitDenominator
  }
}`

  const fetchUrl = "https://exosama-subgraph.moonsama.com/subgraphs/name/moonsama/marketplacev8" // updated
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
 * Returns the total USD value of all resources in MOVR
 * @param {Dict} resources
 * @param {Dict} prices
 * @param {Float} price of MOVR token in USD: movrPrice
 * @returns {totalBuyMovr: number, totalBuyUsd: number, totalSellMovr: number, totalSellUsd: number}
 * @deprecated The network is now Exosama Network. This network uses $SAMA as the base currency. Use getUSDPriceOfRss in ./queryprices.js.
 */
function getTotal(resources, prices, movrPrice){
  let totalBuyMovr = 0
  let totalSellMovr = 0
  for(const {tokenId, name} of materials){
    if(resources.hasOwnProperty(name) && !isNaN(parseFloat(resources[name]))){
      totalBuyMovr+= resources[name] * prices[name].highestBuy
      totalSellMovr+= resources[name] * prices[name].lowestSell
    }
  }

  const totalBuyUsd = totalBuyMovr * movrPrice
  const totalSellUsd = totalSellMovr * movrPrice
  return {totalBuyMovr: totalBuyMovr.toFixed(3), totalBuyUsd: totalBuyUsd.toFixed(2), totalSellMovr: totalSellMovr.toFixed(3), totalSellUsd: totalSellUsd.toFixed(2)}
}

/**
 * Returns the total USD value of all resources in SAMA
 * @param {Dict} resources
 * @param {Dict} prices
 * @param {Float} price of SAMA token in USD: samaPrice
 * @returns {totalBuySama: number, totalBuyUsd: number, totalSellSama: number, totalSellUsd: number}
 */
function getTotalSama(resources, prices, samaPrice){
  let totalBuy = 0
  let totalSell = 0
  for(const {tokenId, name} of materials){
    if(resources.hasOwnProperty(name) && !isNaN(parseFloat(resources[name]))){
      totalBuy+= resources[name] * prices[name].highestBuy
      totalSell+= resources[name] * prices[name].lowestSell
    }
  }

  const totalBuyUsd = totalBuy * samaPrice
  const totalSellUsd = totalSell * samaPrice
  return {totalBuy: totalBuy.toFixed(3), totalBuyUsd: totalBuyUsd.toFixed(2), totalSell: totalSell.toFixed(3), totalSellUsd: totalSellUsd.toFixed(2)}
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
    // console.log(validResources)
    return validResources.sort()
}

// Make the following functions accessible from AlpineJS

// window.getAllMaterialsMovr = getAllMaterialsMovr
window.getAllMaterialsMovr = getAllMaterialsMovr

//load material quote on page load
// window.getAllMaterialsMovrFailed = false 
window.getAllMaterialsSamaFailed = false 

// const getAllMaterialsMovrPromise = getAllMaterialsMovr()
const getAllMaterialsSamaPromise = getAllMaterialsSama()

// getAllMaterialsMovrPromise.catch(()=>{
//   window.getAllMaterialsMovrFailed = true
// })
getAllMaterialsSamaPromise.catch(()=>{
  window.getAllMaterialsSamaFailed = true
})

// window.getAllMaterialsMovrPromise = getAllMaterialsMovrPromise
window.getAllMaterialsSamaPromise = getAllMaterialsSamaPromise

// window.getTotal = getTotal
window.getTotalSama = getTotalSama
window.getUSDPriceOfSama = getUSDPriceOfSama
window.formatDate = formatDate
window.formatDateApi = formatDateApi
window.carnageDates = carnageDates
window.numberWithCommas = numberWithCommas
window.getValidResources = getValidResources
window.prettifyResource = prettifyResource
// Load Alpine
window.Alpine = Alpine
Alpine.start()
