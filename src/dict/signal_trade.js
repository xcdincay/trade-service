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
        leverage
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
    }
};
