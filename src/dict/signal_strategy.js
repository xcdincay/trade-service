export default class SignalStrategy {
    constructor(
        title,
        short_title,
        equity,
        position_size
    ) {
        this.title = title;
        this.short_title = short_title;
        this.equity = equity;
        this.position_size = position_size;
    }
};
