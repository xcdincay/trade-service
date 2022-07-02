export default class TradeOption {
    static get ISOLATED_MARGIN() {
        return 'ISOLATED'
    }

    static get CROSSED_MARGIN() {
        return 'CROSSED'
    }

    static get ORDER_TYPE_LIMIT() {
        return 'LIMIT';
    }

    static get ORDER_TYPE_MARKET() {
        return 'MARKET';
    }

    static get ORDER_TYPE_TAKE_PROFIT_MARKET() {
        return 'TAKE_PROFIT_MARKET';
    }

    static get ORDER_TYPE_STOP_MARKET() {
        return 'STOP_MARKET';
    }
}