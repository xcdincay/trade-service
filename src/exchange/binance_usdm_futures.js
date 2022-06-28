import ccxt from 'ccxt';
const { binanceusdm } = ccxt;

export default class BinanceUsdmFutures {
    constructor() {
        this.ccxtClient = undefined;
        this.last_margin_type = undefined;
        this.last_leverage = undefined;
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
            case 'BTCUSDTPERP':
                return { id: 'BTCUSDT', symbol: 'BTC/USDT' }
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
            if (marginType != this.last_margin_type) {
                await this.ccxtClient.fapiPrivatePostMarginType({ symbol: marketId, marginType: marginType })
                this.last_margin_type = marginType;
            }
        } catch (error) {
            if (error.name != 'MarginModeAlreadySet')
                throw Error(`Could not set margin type. Trade options for the symbol ${marketId}`);
            else
                this.last_margin_type = marginType;
        }

        try {
            if (leverage != this.last_leverage) {
                await this.ccxtClient.fapiPrivate_post_leverage({ symbol: marketId, leverage: leverage });
                this.last_leverage = leverage;
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