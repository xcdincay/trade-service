export default class LastTrade {
    constructor(
        entryPrice,
        exitPrice,
        positionSize,
        leverage,
        pnlPercentage
    ) {
        this.entryPrice = entryPrice;
        this.exitPrice = exitPrice;
        this.positionSize = positionSize;
        this.leverage = leverage;
        this.pnlPercentage = pnlPercentage;
    }
};
