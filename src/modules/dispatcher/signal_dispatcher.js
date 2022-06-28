import { v4 as uuidv4 } from 'uuid';

import Signal from '../../dict/signal.js';
import SignalStatus from '../../dict/signal_status.js';

export default class SignalDispatcher {
    constructor(queueManager) {
        this.queueManager = queueManager;
        this.logManager = null;
    }

    setLogManager(logManager) {
        this.logManager = logManager;
    }

    dispatch(body) {
        let signal;

        try {
            signal = this.convertToNewSignal(body);
        } catch (error) {
            this.logManager.error(`Signal model cannot be converted`, ``);
            return;
        }

        if (!signal) {
            this.logManager.error(`Signal not found to dispatch.`, ``);
            return;
        }

        if (signal.duoSignal && signal.duoSignal == 1)
            this.queueManager.duo_signal_queue.push(signal);
        else
            this.queueManager.single_signal_queue.push(signal);

        this.logManager.warning('Signal pushed to queue.');
    }

    convertToNewSignal(body) {
        return new Signal(
            undefined,
            uuidv4(),
            body.timestamp,
            body.ticker,
            body.timeframe ?? undefined,
            body.system_minimum_tick ?? undefined,
            SignalStatus.PENDING,
            body.strategy ?? undefined,
            body.trade ?? undefined,
            body.type,
            body.duoSignal
        );
    }
}