import ololog from 'ololog';

import Log from '../../dict/log.js';
import LogType from '../../dict/log_type.js';

export default class LogManager {
    constructor(config, notificationManager) {
        this.config = config;
        this.notificationManager = notificationManager;
    }

    error(title, message) {
        this._prepareAndLog(LogType.ERROR, title, message);
    }

    critical(title, message) {
        this._prepareAndLog(LogType.CRITICAL, title, message);
    }

    criticalSuccess(title, message) {
        this._prepareAndLog(LogType.CRITICAL_SUCCESS, title, message);
    }

    warning(title, message) {
        this._prepareAndLog(LogType.WARNING, title, message);
    }

    info(title, message) {
        this._prepareAndLog(LogType.INFO, title, message);
    }

    success(title, message) {
        this._prepareAndLog(LogType.SUCCESS, title, message);
    }

    _prepareAndLog(type, title, message) {
        let myLog = new Log(
            new Date().toISOString(),
            type,
            title,
            message ? message : null
        )

        let logMessage = `> ${myLog.timestamp}: ${myLog.title}`;

        if (this.config.consoleLog) {
            switch (myLog.type) {
                case LogType.ERROR:
                    ololog.bright.red(logMessage);
                    break;
                case LogType.CRITICAL:
                    ololog.bright.red(logMessage);
                    break;
                case LogType.CRITICAL_SUCCESS:
                    ololog.bright.green(logMessage);
                    break;
                case LogType.WARNING:
                    ololog.bright.yellow(logMessage);
                    break;
                case LogType.INFO:
                    ololog.bright.info(logMessage);
                    break;
                case LogType.SUCCESS:
                    ololog.bright.green(logMessage);
                    break;
                default:
                    break;
            }
        }

        this.notificationManager.notifyLog(myLog);
    }
}