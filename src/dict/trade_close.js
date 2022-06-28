import OrderType from '../dict/order_type.js';

export default class TradeClose {
    constructor(
        timestampBeforeOrderCreation,
        timestampAfterOrderCreation,
        exchange,
        _id,
        ticker,
        action,
        signalClosePrice,
        signalContract,
        signalLeverage,
        closeReason,
        pnl,
        contract,
        closePrice,
        feeCost,
        currency,
        since,
        entryPrice,
        leverage,
        marginType) {
        this.timestampBeforeOrderCreation = timestampBeforeOrderCreation;
        this.timestampAfterOrderCreation = timestampAfterOrderCreation;
        this.exchange = exchange;
        this._id = _id;
        this.ticker = ticker;
        this.action = action;
        this.signalClosePrice = signalClosePrice;
        this.signalContract = signalContract;
        this.signalLeverage = signalLeverage;
        this.closeReason = closeReason;
        this.pnl = pnl;
        this.contract = contract;
        this.closePrice = closePrice;
        this.feeCost = feeCost;
        this.currency = currency;
        this.since = since;
        this.entryPrice = entryPrice;
        this.leverage = leverage;
        this.marginType = marginType;
        this.type = OrderType.CLOSE;
    }
}