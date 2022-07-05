import ccxt from 'ccxt';
const { binanceusdm } = ccxt;

export default class BinanceUsdmFutures {
    constructor() {
        this.ccxtClient = undefined;
        this.lastMarginType = [];
        this.lastLeverage = [];
    }

    start(config) {
        this.ccxtClient = new binanceusdm({
            apiKey: config.apiKey,
            secret: config.secret,
            enableRateLimit: true,
            options: {
                defaultType: 'future',
                adjustForTimeDifference: true,
                recvWindow: 60000
            }
        });

        this.ccxtClient.set_sandbox_mode(config.dryRun);
        this.loadMarkets();
    }

    async loadMarkets() {
        await this.ccxtClient.loadMarkets();
    }

    getTickerMarket(ticker) {
        switch (ticker) {
            case 'ETHUSDTPERP':
                return { id: 'ETHUSDT', symbol: 'ETH/USDT', quoteAsset: 'USDT' }
            case 'ETHBUSDPERP':
                return { id: 'ETHBUSD', symbol: 'ETH/BUSD', quoteAsset: 'BUSD' }
            case 'BTCUSDTPERP':
                return { id: 'BTCUSDT', symbol: 'BTC/USDT', quoteAsset: 'USDT' }
            case 'BTCBUSDPERP':
                return { id: 'BTCBUSD', symbol: 'BTC/BUSD', quoteAsset: 'BUSD' }
            default:
                return null;
        }
    }

    getMarket(ticker) {
        let symbol = this.getTickerMarket(ticker).symbol;

        if (!symbol)
            throw Error(`Could not find symbol for the ticker ${ticker}. Please maintain the market-ticker mapping.`);

        let market = this.ccxtClient.market(symbol);

        if (!market)
            throw Error(`Could not find market for the symbol ${symbol}. Please check the market pair list.`);

        return market;
    }

    async setTradeOptions(marketId, marginType, leverage) {
        if (!leverage)
            return;

        try {
            if (marginType != this.lastMarginType[marketId]) {
                await this.ccxtClient.fapiPrivatePostMarginType({ symbol: marketId, marginType: marginType })
                this.lastMarginType[marketId] = marginType;
            }
        } catch (error) {
            if (error.name != 'MarginModeAlreadySet')
                throw Error(`Could not set margin type. Trade options for the symbol ${marketId}`);
            else
                this.lastMarginType[marketId] = marginType;
        }

        try {
            if (leverage != this.lastLeverage[marketId]) {
                await this.ccxtClient.fapiPrivate_post_leverage({ symbol: marketId, leverage: leverage });
                this.lastLeverage[marketId] = leverage;
            }
        } catch (error) {
            throw Error(`Could not set leverage. Trade options for the symbol ${marketId} or leverage ${leverage}`);
        }
    }

    async getBalanceAndOpenPositionAmount(marketId) {
        let balance = await this.ccxtClient.fetchBalance();
        let openPosition = balance.info.positions.filter(x => x.symbol == marketId && x.positionAmt != 0);

        return {
            balance: balance,
            openPosition: openPosition
        };
    }
}