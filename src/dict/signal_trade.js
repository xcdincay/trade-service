import LastTrade from './last_trade.js';

export default class SignalTrade {
    constructor(
        entryPrice,
        stopLossPrice,
        takeProfitPrice,
        stopLossInTicks,
        takeProfitInTicks,
        action,
        contracts,
        calculatedContracts,
        leverage,
        lastTrade
    ) {
        this.entryPrice = entryPrice;
        this.stopLossPrice = stopLossPrice;
        this.takeProfitPrice = takeProfitPrice;
        this.stopLossInTicks = stopLossInTicks;
        this.takeProfitInTicks = takeProfitInTicks;
        this.action = action;
        this.contracts = contracts;
        this.calculatedContracts = calculatedContracts;
        this.leverage = leverage;
        this.lastTrade = lastTrade
            ?
            new LastTrade(
                lastTrade.entry_price,
                lastTrade.exit_price,
                lastTrade.position_size,
                lastTrade.leverage,
                lastTrade.pnl_percentage
            )
            :
            undefined;
    }
};
