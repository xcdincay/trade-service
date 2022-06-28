import SignalStatus from '../../dict/signal_status.js';

export default class SignalListener {
    constructor(tradeManager, notificationManager, logManager) {
        this.tradeManager = tradeManager;
        this.notificationManager = notificationManager;
        this.logManager = logManager;
    }

    async onSignalReceived(signal) {
        if (!signal)
            throw Error('Signal not found to add to queue.');

        try {
            this.notificationManager.notifySignal(signal);
            let result = await this.tradeManager.trade(signal);
            
            if (this.tradeManager.isTradingStarted()) {
                if (result.succeeded) {
                    signal.status = SignalStatus.COMPLETED;
                }
                else {
                    signal.status = SignalStatus.CANCELLED;
                }
            } else {
                this.logManager.critical(`Trading mode is off.`, `Let me trade, if you want.`);
            }
        } catch (error) {
            this.logManager.error(`Signal was not processed.`, `Signal id could not be generated.`);
            
            if (signal._id) {
                signal.status = SignalStatus.CANCELLED;
            }

            throw error;
        }
    }
}