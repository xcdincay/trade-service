export default class SignalStrategy {
    constructor(
        title,
        shortTitle,
        equity,
        positionSize
    ) {
        this.title = title;
        this.shortTitle = shortTitle;
        this.equity = equity;
        this.positionSize = positionSize;
    }
};
