export default class SignalStrategy {
    constructor(
        title,
        short_title,
        equity,
        has_opentrades,
        position_size
    ) {
        this.title = title;
        this.short_title = short_title;
        this.equity = equity;
        this.has_opentrades = has_opentrades;
        this.position_size = position_size;
    }
};
