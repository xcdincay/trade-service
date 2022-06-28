export default class ExchangeManager {
    constructor(exchange, config) {
        this.config = config;
        this.exchange = exchange;
    }

    init() {
        this.exchange.start(this.config.exchanges.binanceusdm);
    }

    async fetchBalance() {
        let balance = await this.exchange.ccxtClient.fetchBalance();
        return balance;
    }
}