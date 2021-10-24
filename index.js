const ccxt = require('ccxt')
const moment = require('moment')
const delay = require('delay')
const fs = require('fs')
require('dotenv').config();


const binance = new ccxt.binance({
    apiKey: process.env.API_KEY,
    secret: process.env.SECRET
});
binance.setSandboxMode(true)

async function getBalance(btcPrice) {
    const balance = await binance.fetchBalance()
    const total = balance.total
    console.log(`Balance BTC: ${total.BTC}, USDT: ${total.USDT}`)
    fs.appendFileSync('./trade_log.txt',`Balance BTC: ${total.BTC}, USDT: ${total.USDT}\n`)
    console.log(`Total USDT: ${(total.BTC-1)*btcPrice + total.USDT}. \n`)
    fs.appendFileSync('./trade_log.txt',`Total USDT: ${(total.BTC-1)*btcPrice + total.USDT}.\n \n`)
}

async function tick(){

    const price = await binance.fetchOHLCV('BTC/USDT', '1m', undefined, 5);
    const bPrice = price.map(price => {
        return {
            timestamp: moment(price[0]).format(),
            open: price[1],
            high: price[2],
            low: price[3],
            close: price[4],
            volume: price[5],
        }
    })

    const averagePrice = bPrice.reduce((acc, price) => acc + price.close, 0) / 5
    const lastPrice = bPrice[bPrice.length - 1].close
    console.log(`Last 5 prices: ${bPrice.map(p => p.close)}`)
    fs.appendFileSync('./trade_log.txt',`Last 5 prices: ${bPrice.map(p => p.close)}\n`)

    //Process price
    let direction = lastPrice > averagePrice ? 'sell' : 'buy'
    const TRADE_SIZE = 100
    const quantity = TRADE_SIZE / lastPrice

    console.log(`Average price: ${averagePrice}, Last price: ${lastPrice}`)
    fs.appendFileSync('./trade_log.txt',`Average price: ${averagePrice}, Last price: ${lastPrice}\n`)
    const order = await binance.createMarketOrder('BTC/USDT', direction, quantity)
    console.log(`${moment().format()}: ${direction} ${quantity} BTC at ${lastPrice}`)
    fs.appendFileSync('./trade_log.txt',`${moment().format()}: ${direction} ${quantity} BTC at ${lastPrice}\n`)
    getBalance(lastPrice)
    
}

async function main() {
    while(true){
        await tick();
        await delay(60*1000)
    }
}

main();
// getBalance();