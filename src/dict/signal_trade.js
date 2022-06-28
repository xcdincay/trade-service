export default class SignalTrade {
    constructor(
        entry_price,
        stop_loss_price,
        take_profit_price,
        stop_loss_in_ticks,
        take_profit_in_ticks,
        action,
        contracts,
        calculatedContracts,
        leverage,
        gross_profit,
        commission,
        net_profit
    ) {
        this.entry_price = entry_price;
        this.stop_loss_price = stop_loss_price;
        this.take_profit_price = take_profit_price;
        this.stop_loss_in_ticks = stop_loss_in_ticks;
        this.take_profit_in_ticks = take_profit_in_ticks;
        this.action = action;
        this.contracts = contracts;
        this.calculatedContracts = calculatedContracts;
        this.leverage = leverage;
        this.gross_profit = gross_profit;
        this.commission = commission;
        this.net_profit = net_profit;
    }
};
