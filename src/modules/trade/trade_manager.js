import ccxt from 'ccxt';

import timeago from 'timeago.js';

import TradeType from '../../dict/trade_type.js';
import TradeOption from '../../dict/trade_option.js';

import TradeEntry from '../../dict/trade_entry.js';
import TradeClose from '../../dict/trade_close.js';

const { DDoSProtection, RequestTimeout, AuthenticationError, ExchangeNotAvailable, ExchangeError, NetworkError } = ccxt;
const { format } = timeago;

export default class TradeManager {
    constructor(exchangeManager, notificationManager, logManager, systemUtil) {
        this.exchangeManager = exchangeManager;
        this.notificationManager = notificationManager;
        this.logManager = logManager;
        this.systemUtil = systemUtil;

        this.tradingStarted = this.systemUtil.getConfig('trade.startOnInit', false);
        this.defaultLatencyRectWindow = 30;
    }

    startTrading() { (this.tradingStarted = true) };
    stopTrading() { this.tradingStarted = false };

    isTradingStarted() {
        return this.tradingStarted;
    }

    async trade(signal) {
        let succeeded = false;

        if (this.tradingStarted) {
            switch (signal.type) {
                case TradeType.BUY:
                case TradeType.SELL:
                    succeeded = await this.entry(signal);
                    break;

                case TradeType.CLOSE_BUY:
                case TradeType.CLOSE_SELL:
                case TradeType.CLOSE_ALL:
                case TradeType.SLTP:
                    succeeded = await this.close(signal);
                    break;

                default:
                    this.logManager.error(`Invalid signal type ${signal.type}.`, `Please check the signal type.`);
                    break;
            }
        }

        return {
            succeeded: succeeded,
            tradingStarted: this.tradingStarted
        };
    }

    async getExchangeContext(signal) {
        let bopa;
        let market;

        try {
            market = this.exchangeManager.exchange.getTickerMarket(signal.ticker);
            bopa = await this.exchangeManager.exchange.getBalanceAndOpenPositionAmount(market.id);
        } catch (error) {
            this.logManager.error(`Exchange context error.`, `Signal type: ${signal.type}. Inner exception: ${error.message}`);
            return null;
        }

        return {
            market: market,
            balance: bopa.balance,
            openPositionAmount: bopa.openPosition[0] ? bopa.openPosition[0].positionAmt : 0
        }
    }

    checkSignalTimeLatency(timeframe, signalTimestamp, receivedTimestamp) {
        if (!this.systemUtil.getConfig('trade.signalLatencyCheckEnabled', true))
            return true;

        if (!timeframe || !signalTimestamp || !receivedTimestamp)
            return false;

        let interval;

        if (timeframe == parseInt(timeframe))
            interval = parseInt(timeframe)
        else
            interval = timeframe;

        let times = this.systemUtil.generateTimesFromInterval(interval);

        let signalDateIsoString = signalTimestamp.substring(0, 19) + "+00:00";
        let signalDate = new Date(signalDateIsoString);

        let receivedDateIsoString = receivedTimestamp.substring(0, 19) + "+00:00";
        let receivedDate = new Date(receivedDateIsoString);

        const findClosestTime = (data, target) =>
            data.reduce((prev, curr) => {
                return target >= curr ? curr : prev;
            });

        let closestTime = findClosestTime(times, signalDate);
        let latencyInSeconds = (receivedDate - closestTime) / 1000;

        if (latencyInSeconds < 0 ||
            latencyInSeconds > this.systemUtil.getConfig('trade.signalLatencyRectWindow', this.defaultLatencyRectWindow))
            return false;

        return true;
    }

    async checkCommonTradeData(signal) {
        if (signal.type != TradeType.CLOSE_ALL) {
            if (signal.trade.contracts == 0) {
                this.logManager.error(`Invalid contract amount.`, `Signal type: ${signal.type}. Contracts cannot be zero for ticker ${signal.ticker}.`);
                return false;
            }
        }

        return true;
    }

    async checkEntryTradeData(signal) {
        if (!this.checkSignalTimeLatency(signal.timeframe, signal.timestamp, signal.instanceTimestamp)) {
            this.logManager.error(`Signal latency must be less than ${this.systemUtil.getConfig('trade.signalLatencyRectWindow', this.defaultLatencyRectWindow)} seconds.`);
            return false;
        }

        if (!await this.checkCommonTradeData(signal))
            return false;

        if (signal.type != TradeType.BUY && signal.type != TradeType.SELL) {
            this.logManager.error(`Invalid signal type for entry order.`, `Signal type: ${signal.type}. Please check the signal type.`);
            return false;
        }

        if ((signal.type == TradeType.BUY && signal.trade.action != 'buy') ||
            (signal.type == TradeType.SELL && signal.trade.action != 'sell')) {
            this.logManager.error(`Invalid action type for entry order.`, `Signal type: ${signal.type}. Action: ${signal.trade.action}. Please check the signal type or action.`);
            return false;
        }

        return true;
    }

    async checkCloseTradeData(signal) {
        if (!await this.checkCommonTradeData(signal))
            return false;

        if (signal.type != TradeType.CLOSE_BUY && signal.type != TradeType.CLOSE_SELL && signal.type != TradeType.SLTP && signal.type != TradeType.CLOSE_ALL) {
            this.logManager.error(`Invalid signal type for close order.`, `Signal type: ${signal.type}. Please check the signal type.`);
            return false;
        }

        if ((signal.type == TradeType.CLOSE_BUY && signal.trade.action != 'sell') ||
            (signal.type == TradeType.CLOSE_SELL && signal.trade.action != 'buy')) {
            this.logManager.error(`Invalid action type for close order.`, `Signal type: ${signal.type}. Action: ${signal.trade.action}. Please check the signal type or action.`);
            return false;
        }

        return true;
    }

    async calculateEntryTradeAmount(signal, balance, quoteAsset) {
        if (!balance[quoteAsset])
            return;

        let tradableBalanceRatio = this.systemUtil.getConfig('trade.tradableBalanceRatio', 0.99);
        let equity = signal.strategy.equity > balance[quoteAsset].free ? balance[quoteAsset].free : signal.strategy.equity;
        let orderSize = ((equity * tradableBalanceRatio) * signal.trade.leverage) / signal.trade.entryPrice;
        signal.trade.calculatedContracts = orderSize;
    }

    async entry(signal) {
        if (!await this.checkEntryTradeData(signal))
            return false;

        this.logManager.warning('Before get exchange context.');
        let exchangeContext = await this.getExchangeContext(signal);
        if (!exchangeContext)
            return false;
        this.logManager.warning('After get exchange context.');

        if (exchangeContext.openPositionAmount != 0) {
            this.logManager.error(`Already have open position.`, `Signal type: ${signal.type}. There is already an open position on ${signal.ticker} and position amount is ${exchangeContext.openPositionAmount}.`);
            return false;
        }

        let timestampBeforeOrderCreation;
        let timestampAfterOrderCreation;
        let limitSide;
        let fullfilledOrders = [];

        try {
            this.logManager.warning('Before set trade options.');
            await this.exchangeManager.exchange.setTradeOptions(exchangeContext.market.id, TradeOption.ISOLATED_MARGIN, signal.trade.leverage);
            this.logManager.warning('After set trade options.');

            await this.calculateEntryTradeAmount(signal, exchangeContext.balance, exchangeContext.market.quoteAsset);

            if (signal.trade.calculatedContracts == 0) {
                this.logManager.error(`Entry order trade amount could not calculated.`, `Error occured for ${signal.type} ${signal.ticker}`);
                return false;
            }

            timestampBeforeOrderCreation = new Date().toISOString();

            let orders = [
                this.exchangeManager.exchange.ccxtClient.createOrder(exchangeContext.market.symbol, TradeOption.ORDER_TYPE_MARKET, signal.trade.action, signal.trade.calculatedContracts),
                this.exchangeManager.exchange.ccxtClient.cancelAllOrders(exchangeContext.market.symbol)
            ];

            fullfilledOrders = await Promise.all(orders);

            if (this.systemUtil.getConfig('trade.sltpOnEntryEnabled', true)) {
                limitSide = signal.trade.action == "buy" ? "sell" : "buy";

                let limitOrders = [
                    this.exchangeManager.exchange.ccxtClient.createOrder(exchangeContext.market.symbol, TradeOption.ORDER_TYPE_TAKE_PROFIT_MARKET, limitSide, signal.trade.calculatedContracts, signal.trade.takeProfitPrice, { stopPrice: signal.trade.takeProfitPrice }),
                    this.exchangeManager.exchange.ccxtClient.createOrder(exchangeContext.market.symbol, TradeOption.ORDER_TYPE_STOP_MARKET, limitSide, signal.trade.calculatedContracts, signal.trade.stopLossPrice, { stopPrice: signal.trade.stopLossPrice })
                ];

                await Promise.all(limitOrders);
            }

            timestampAfterOrderCreation = new Date().toISOString();
        } catch (error) {
            timestampAfterOrderCreation = new Date().toISOString();
            this.logManager.error(`Entry order creation failed.`, `Error occured for ${signal.type} ${signal.ticker} ${signal.trade.calculatedContracts}`);
            this._logExchangeException(error);
            return false;
        }

        try {
            if (fullfilledOrders) {
                this.logManager.success(`Order created successfully.`, `${signal.type} ${signal.ticker} with ${signal.trade.action} action. Contracts: ${signal.trade.contracts}`);

                let position = await this._getCurrentPositionBySymbol(exchangeContext.market.id);
                let trades = await this._getLastAndPreviousTradeByOrder(exchangeContext.market.symbol, fullfilledOrders[0], 999);

                let tradeEntry = new TradeEntry(
                    timestampBeforeOrderCreation,
                    timestampAfterOrderCreation,
                    this.exchangeManager.exchange.ccxtClient.name,
                    signal._id,
                    signal.ticker,
                    signal.trade.action,
                    signal.trade.entryPrice,
                    signal.trade.contracts,
                    signal.trade.leverage,
                    trades.trade.fee.cost,
                    trades.trade.fee.currency,
                    position.notional,
                    position.positionAmt,
                    position.entryPrice,
                    position.leverage,
                    position.isolated ? TradeOption.ISOLATED_MARGIN : TradeOption.CROSSED_MARGIN
                )

                this.notificationManager.notifyTradeEntry(tradeEntry);
                return true;
            }

            return false;
        } catch (error) {
            this.logManager.error(`Post entry order operations failed.`, `Error occured after entry order creation ${signal.type} ${signal.ticker}. Inner exception: ${error.message}`);
            return false;
        }
    }

    async close(signal) {
        if (!await this.checkCloseTradeData(signal))
            return false;

        this.logManager.warning('Before get exchange context.');
        let exchangeContext = await this.getExchangeContext(signal);
        if (!exchangeContext)
            return false;
        this.logManager.warning('After get exchange context.');

        if (exchangeContext.openPositionAmount == 0) {
            await this.exchangeManager.exchange.ccxtClient.cancelAllOrders(exchangeContext.market.symbol);
            this.logManager.error(`No open position.`, `Signal type: ${signal.type}. There is not an open position on ${signal.ticker} and position amount is ${exchangeContext.openPositionAmount}.`);
            return false;
        } else {
            if (signal.type != TradeType.SLTP) {
                if (signal.type == TradeType.CLOSE_BUY && exchangeContext.openPositionAmount < 0) {
                    this.logManager.error(`Invalid signal type to close short position.`, `Position is short on ${signal.ticker}, cannot close the position with ${signal.type}.`);
                    return false;
                } else if (signal.type == TradeType.CLOSE_SELL && exchangeContext.openPositionAmount > 0) {
                    this.logManager.error(`Invalid signal type to close long position.`, `Position is long on ${signal.ticker}, cannot close the position with ${signal.type}.`);
                    return false;
                }
            } else {
                if (signal.trade.action == 'sell' && exchangeContext.openPositionAmount < 0) {
                    this.logManager.error(`Invalid signal type to execute sltp.`, `Position is short on ${signal.ticker}, cannot sltp the position with ${signal.trade.action}.`);
                    return false;
                }
                else if (signal.trade.action == 'buy' && exchangeContext.openPositionAmount > 0) {
                    this.logManager.error(`Invalid action type to execute sltp.`, `Position is long on ${signal.ticker}, cannot sltp the position with ${signal.trade.action}.`);
                    return false;
                }
            }
        }

        let position;
        let timestampBeforeOrderCreation;
        let timestampAfterOrderCreation;
        let fullfilledOrders = [];

        try {
            this.logManager.warning('Before get current position by symbol.');
            position = await this._getCurrentPositionBySymbol(exchangeContext.market.id, exchangeContext.balance);
            let orderSide = position.positionAmt > 0 ? 'sell' : position.positionAmt < 0 ? 'buy' : 'unknown';
            this.logManager.warning('After get current position by symbol.');

            timestampBeforeOrderCreation = new Date().toISOString();
            let orders = [
                this.exchangeManager.exchange.ccxtClient.createOrder(exchangeContext.market.symbol, TradeOption.ORDER_TYPE_MARKET, orderSide, Math.abs(position.positionAmt))
            ];

            if (this.systemUtil.getConfig('trade.sltpOnEntryEnabled', true)) {
                orders.push(this.exchangeManager.exchange.ccxtClient.cancelAllOrders(exchangeContext.market.symbol))
            }

            fullfilledOrders = await Promise.all(orders);
            timestampAfterOrderCreation = new Date().toISOString();
        } catch (error) {
            timestampAfterOrderCreation = new Date().toISOString();
            this.logManager.error(`Close order creation failed.`, `Error occured for ${signal.type} ${signal.ticker}`);
            this._logExchangeException(error);
            return false;
        }

        try {
            if (fullfilledOrders) {
                this.logManager.success(`Order closed successfully.`, `${signal.type} ${signal.ticker} with ${signal.trade.action} action. Contracts: ${signal.trade.contracts}`);

                let trades = await this._getLastAndPreviousTradeByOrder(exchangeContext.market.symbol, fullfilledOrders[0], 999);
                let since = format(new Date(trades.entryOrderTimestamp));

                let tradeClose = new TradeClose(
                    timestampBeforeOrderCreation,
                    timestampAfterOrderCreation,
                    this.exchangeManager.exchange.ccxtClient.name,
                    signal._id,
                    signal.ticker,
                    signal.trade.action,
                    signal.trade.entryPrice,
                    signal.trade.contracts,
                    signal.trade.leverage,
                    signal.type,
                    trades.trade.info.realizedPnl,
                    trades.trade.info.qty,
                    trades.trade.info.price,
                    trades.trade.fee.cost,
                    trades.trade.fee.currency,
                    since,
                    position.entryPrice,
                    position.leverage,
                    signal.trade.lastTrade,
                    position.isolated ? TradeOption.ISOLATED_MARGIN : TradeOption.CROSSED_MARGIN
                )

                this.notificationManager.notifyTradeClose(tradeClose);
                return true;
            }

        } catch (error) {
            this.logManager.error(`Post close order operations failed.`, `Error occured after close order creation ${signal.type} ${signal.ticker}. Inner exception: ${error.message}`);
            return false;
        }
    }

    async _getCurrentPositionBySymbol(symbol, balance) {
        if (!balance) {
            balance = await this.exchangeManager.exchange.ccxtClient.fetchBalance();
        }

        let position = balance.info.positions.find(p => p.symbol == symbol);
        return position;
    }

    async _getLastAndPreviousTradeByOrder(symbol, order, loopbackCount) {
        let trade = {
            info: {
                realizedPnl: 0,
                qty: 0,
                price: 0
            },
            fee: {
                cost: 0,
                currency: undefined
            }
        };

        try {
            const trades = await this.exchangeManager.exchange.ccxtClient.fetchMyTrades(symbol, undefined, loopbackCount, undefined);
            let filteredTrades = trades.filter(t => t.order == order.id);

            for (let index = 0; index < filteredTrades.length; index++) {
                const ft = filteredTrades[index];

                trade.info.realizedPnl = trade.info.realizedPnl + parseFloat(ft.info.realizedPnl);
                trade.info.qty = trade.info.qty + parseFloat(ft.info.qty);
                trade.info.price = trade.info.price + parseFloat(ft.info.price);
                trade.fee.cost = trade.fee.cost + parseFloat(ft.fee.cost);
                trade.fee.currency = ft.fee.currency;
            }

            trade.info.price = trade.info.price / (filteredTrades.length != 0 ? filteredTrades.length : 1);

            let firstTradeIndex = trades.findIndex(t => t.id == filteredTrades[0].id);
            let previousTradeIndex = firstTradeIndex - 1;
            let previousTrade = trades[previousTradeIndex];

            return {
                trade: trade,
                entryOrderTimestamp: previousTrade.timestamp ? previousTrade.timestamp : new Date().getTime()
            }
        } catch (error) {
            this.logManager.error(`Get last trades failed.`, `Error occured after order creation. Inner exception: ${error.message}`);

            return {
                trade: trade,
                entryOrderTimestamp: new Date().getTime()
            }
        }

    }

    _logExchangeException(error) {
        if (error instanceof DDoSProtection || error.message.includes('ECONNRESET')) {
            this.logManager.error(`DDoS protection.`, `${error.message}`);
        } else if (error instanceof RequestTimeout) {
            this.logManager.error(`Request timeout.`, `${error.message}`);
        } else if (error instanceof AuthenticationError) {
            this.logManager.error(`Authentication error.`, `${error.message}`);
        } else if (error instanceof ExchangeNotAvailable) {
            this.logManager.error(`Exchange not available error.`, `${error.message}`);
        } else if (error instanceof ExchangeError) {
            this.logManager.error(`Exchange error.`, `${error.message}`);
        } else if (error instanceof NetworkError) {
            this.logManager.error(`Network error.`, `${error.message}`);
        } else {
            this.logManager.error(`Monsterader error.`, `${error.message}`);
        }
    }
}