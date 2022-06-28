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
}