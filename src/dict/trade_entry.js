import OrderType from '../dict/order_type.js';

export default class TradeEntry {
    constructor(
        timestampBeforeOrderCreation,
        timestampAfterOrderCreation,
        exchange,
        _id,
        ticker,
        action,
        signalEntryPrice,
        signalContract,
        signalLeverage,
        feeCost,
        currency,
        cost,
        contract,
        entryPrice,
        leverage,
        marginType) {
        this.timestampBeforeOrderCreation = timestampBeforeOrderCreation;
        this.timestampAfterOrderCreation = timestampAfterOrderCreation;
        this.exchange = exchange;
        this._id = _id;
        this.ticker = ticker;
        this.action = action;
        this.signalEntryPrice = signalEntryPrice;
        this.signalContract = signalContract;
        this.signalLeverage = signalLeverage;
        this.cost = cost;
        this.contract = contract;
        this.feeCost = feeCost;
        this.currency = currency;
        this.entryPrice = entryPrice;
        this.leverage = leverage;
        this.marginType = marginType;
        this.type = OrderType.ENTRY;
    }
}