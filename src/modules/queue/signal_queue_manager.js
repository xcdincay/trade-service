import Queue from 'better-queue';
import TradeType from '../../dict/trade_type.js';

export default class SignalQueueManager {
    constructor(signalListener, logManager) {
        this.signalListener = signalListener;
        this.logManager = logManager;

        this.single_signal_queue = null;
        this.duo_signal_queue = null;
    }

    init() {
        const self = this;

        this.single_signal_queue = new Queue(
            (batch, cb) => this._onQueueItemAdded(batch, cb, false),

            {
                // Batch settings
                batchSize: 1,

                // Retry settings, if the task fails
                maxRetries: 1,
                retryDelay: 1000,

                // Task priority
                priority: this._setPriority
            }
        );

        this.single_signal_queue.on('task_finish', function (taskId, result, stats) {
            self.logManager.success(`Task successfully completed.`, `Task: ${taskId}. Elapsed: ${stats.elapsed}.`);
        })

        this.single_signal_queue.on('task_failed', function (taskId, error, stats) {
            self.logManager.error(`Task failed.`, `Task: ${taskId}. Elapsed: ${stats.elapsed}.`);
        })

        this.duo_signal_queue = new Queue(
            (batch, cb) => this._onQueueItemAdded(batch, cb, true),

            {
                // Batch settings
                // The queue will wait for 2 items to fill up in 10 seconds or process the queue if no new tasks were added in 10 second.
                batchSize: 2,
                batchDelay: 10000,

                // Retry settings, if the task fails
                maxRetries: 1,
                retryDelay: 1000,

                // Task priority
                priority: this._setPriority
            }
        );

        this.duo_signal_queue.on('task_finish', function (taskId, result, stats) {
            self.logManager.success(`Task successfully completed.`, `Task: ${taskId}. Elapsed: ${stats.elapsed}.`);
        })

        this.duo_signal_queue.on('task_failed', function (taskId, error, stats) {
            self.logManager.error(`Task failed.`, `Task: ${taskId}. Elapsed: ${stats.elapsed}.`);
        })
    }

    async _onQueueItemAdded(batch, cb, duoSignalQueue) {
        this.logManager.warning('Before queue item execution.');

        try {
            if (duoSignalQueue) {
                for (let index = 0; index < batch.length; index++) {
                    let task = batch[index];
                    await this.signalListener.onSignalReceived(task);
                }
            }
            else {
                await this.signalListener.onSignalReceived(batch);
            }

            cb(null, batch);
        } catch (error) {
            cb(new Error(`Listener has failed. Inner error message (${error.message})`), null);
        }

        this.logManager.warning('After queue item execution.');
    }

    _setPriority(task, cb) {
        // Entry signal priority 1
        // Close signal priority 2
        // Close signals take priority over entry signals

        switch (task.type) {
            case TradeType.BUY:
            case TradeType.SELL:
                cb(null, 1);
                break;

            case TradeType.CLOSE_BUY:
            case TradeType.CLOSE_SELL:
            case TradeType.CLOSE_ALL:
            case TradeType.SLTP:
                cb(null, 2);
                break;

            default:
                throw Error(`Queue priority has failed.`, `Invalid signal type ${task.type}.`);
        }
    }
}