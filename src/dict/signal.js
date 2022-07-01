import SignalStrategy from '../dict/signal_strategy.js';
import SignalTrade from '../dict/signal_trade.js';

export default class Signal {
    constructor(
        _id,
        id,
        timestamp,
        ticker,
        timeframe,
        systemMinimumTick,
        status,
        strategy,
        trade,
        type,
        duoSignal
    ) {
        this._id = _id;
        this.id = id;
        this.timestamp = timestamp;
        this.instanceTimestamp = new Date().toISOString();
        this.ticker = ticker;
        this.timeframe = timeframe;
        this.systemMinimumTick = systemMinimumTick;
        this.status = status;

        this.strategy = strategy
            ?
            new SignalStrategy(
                strategy.title,
                strategy.short_title,
                strategy.equity,
                strategy.position_size
            )
            :
            undefined;

        this.trade = trade
            ?
            new SignalTrade(
                trade.entry_price,
                trade.stop_loss_price,
                trade.take_profit_price,
                trade.stop_loss_in_ticks,
                trade.take_profit_in_ticks,
                trade.action,
                trade.contracts,
                0,
                trade.leverage
            )
            :
            undefined;

        this.type = type;
        this.duoSignal = duoSignal;
    }
};
