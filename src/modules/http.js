import express, { json } from 'express';
import { StatusCodes } from 'http-status-codes';

export default class Http {
    constructor(systemUtil, appSettings, signalDispatcher, logManager, projectDir) {
        this.systemUtil = systemUtil;
        this.appSettings = appSettings;
        this.signalDispatcher = signalDispatcher;
        this.logManager = logManager;
        this.projectDir = projectDir;

        this.app = null;
    }

    start() {
        if (this.app)
            return;

        const app = express();
        app.use(express.json());
        app.use(express.text());

        app.get('/', (req, res) => {
            res.send(`Service Version ${this.appSettings.version}\n`);
        });

        app.post('/signal', (req, res) => {
            this.logManager.warning(`New signal received.`, req.body);
            let isTextBody = req.is('text/*') ? true : false;

            if (isTextBody) {
                this.logManager.criticalSuccess(req.body);
            }
            else {
                const accessToken = this.systemUtil.getConfig('authentication.accessToken');
                if (!req.body.authentication || !req.body.authentication.bearer || req.body.authentication.bearer != accessToken) {
                    this.logManager.error(`Unauthorized access detected.`, `Please check application endpoints.`);

                    res.statusCode = StatusCodes.UNAUTHORIZED;
                    res.send();
                    return;
                }

                this.signalDispatcher.dispatch(req.body);
            }

            res.statusCode = StatusCodes.OK;
            res.send();
        });

        const host = this.systemUtil.getConfig('webserver.host');
        const port = process.env.PORT || this.systemUtil.getConfig('webserver.port');

        app.listen(port);
        this.app = app;

        this.logManager.criticalSuccess(`Trader v${this.appSettings.version} started on ${host}`, `${process.env.NODE_ENV} / ${process.env.NX_CONFIG_FILE_NAME}`);
    }
}