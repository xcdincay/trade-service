export default class SignalTrade {
    constructor(
        entry_price,
        stop_loss_in_ticks,
        take_profit_in_ticks,
        action,
        contracts,
        calculatedContracts,
        leverage
    ) {
        this.entry_price = entry_price;
        this.stop_loss_in_ticks = stop_loss_in_ticks;
        this.take_profit_in_ticks = take_profit_in_ticks;
        this.action = action;
        this.contracts = contracts;
        this.calculatedContracts = calculatedContracts;
        this.leverage = leverage;
    }
};
