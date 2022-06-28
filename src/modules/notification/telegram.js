import fetch from 'node-fetch';
import { markdownTable } from 'markdown-table';
import Emoji from '../../dict/emoji.js';

import UserRole from '../../dict/user_role.js';

export default class Telegram {
    constructor(telegraf, config, appSettings, systemUtil) {
        this.telegraf = telegraf;
        this.config = config;
        this.appSettings = appSettings;
        this.systemUtil = systemUtil;

        this.exchangeManager = null;
        this.tradeManager = null;
        this.logManager = null;

        telegraf.command('help', (ctx) => this.executeHelpCommand(ctx));
        telegraf.command('start', (ctx) => this.executeStartCommand(ctx));
        telegraf.command('stop', (ctx) => this.executeStopCommand(ctx));
        telegraf.command('status', (ctx) => this.executeStatusCommand(ctx));
        telegraf.command('balance', (ctx) => this.executeBalanceCommand(ctx));
        telegraf.command('version', (ctx) => this.executeVersionCommand(ctx));
        telegraf.command('close_all_positions', (ctx) => this.executeCloseAllPositionsCommand(ctx));
        telegraf.launch();
    }

    setExchangeManager(exchangeManager) {
        this.exchangeManager = exchangeManager;
    }

    setTradeManager(tradeManager) {
        this.tradeManager = tradeManager;
    }

    setLogManager(logManager) {
        this.logManager = logManager;
    }

    send(message) {
        const chatId = this.config.chat_id;

        if (!chatId) {
            return;
        }

        let escapedMessage = message
            .replace(/\./g, '\\.')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/\#/g, '\\#')
            .replace(/\>/g, '\\>')
            .replace(/\</g, '\\<')
            .replace(/\-/g, '\\-')
            .replace(/\_/g, '\\_')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/\|/g, '\\|')
            .replace(/\+/g, '\\+');

        this.telegraf.telegram.sendMessage(chatId, escapedMessage, { parse_mode: 'MarkdownV2' }).catch(error => {
            console.log(error.message);
        });
    }

    executeHelpCommand(ctx) {
        try {
            let userRole = this._getUserRole(ctx);
            if (userRole != UserRole.ADMIN && userRole != UserRole.VIEWER) {
                this._sendUnauthorizedMessage(ctx);
                return;
            }

            let messageList = [];
            messageList = messageList.concat('I can help you to earn money.\n');
            messageList = messageList.concat('You can control me by sending these commands:\n');
            messageList = messageList.concat('\n');

            messageList = messageList.concat('*Execution Commands*\n');
            messageList = messageList.concat('/version - version status\n');
            messageList = messageList.concat('/status - trading status\n');
            messageList = messageList.concat('/start - start trading\n');
            messageList = messageList.concat('/stop - stop trading\n');
            messageList = messageList.concat('\n');

            messageList = messageList.concat('*Trade Commands*\n');
            messageList = messageList.concat('/balance - fetch account balance\n');
            messageList = messageList.concat('\n');

            messageList = messageList.concat('*Dangerous Commands*\n');
            messageList = messageList.concat('/close_all_positions - close all open position immediately\n');

            let message = messageList.join('');
            this.send(message);
        } catch (error) {
            this.logManager.error(`Help command failed.`, `Inner exception: ${error.message}`);
        }
    }

    executeStartCommand(ctx) {
        try {
            let userRole = this._getUserRole(ctx);
            if (userRole != UserRole.ADMIN) {
                this._sendUnauthorizedMessage(ctx);
                return;
            }

            this.tradeManager.startTrading();
            this.logManager.criticalSuccess(`Trading started.`, ``);
        } catch (error) {
            this.logManager.error(`Start command failed.`, `Inner exception: ${error.message}`);
        }
    }

    executeStopCommand(ctx) {
        try {
            let userRole = this._getUserRole(ctx);
            if (userRole != UserRole.ADMIN) {
                this._sendUnauthorizedMessage(ctx);
                return;
            }

            this.tradeManager.stopTrading();
            this.logManager.critical(`Trading stopped.`, ``);
        } catch (error) {
            this.logManager.error(`Stop command failed.`, `Inner exception: ${error.message}`);
        }
    }

    executeStatusCommand(ctx) {
        try {
            let userRole = this._getUserRole(ctx);
            if (userRole != UserRole.ADMIN && userRole != UserRole.VIEWER) {
                this._sendUnauthorizedMessage(ctx);
                return;
            }

            let tradingStarted = this.tradeManager.isTradingStarted();
            let messageList = [];

            if (tradingStarted)
                messageList = messageList.concat(`${Emoji.GREEN_CIRCLE} Trading on.`);
            else
                messageList = messageList.concat(`${Emoji.RED_CIRCLE} Trading off.`);

            let message = messageList.join('\n');
            this.send(message);
        } catch (error) {
            this.logManager.error(`Status command failed.`, `Inner exception: ${error.message}`);
        }
    }

    async executeBalanceCommand(ctx) {
        try {
            let userRole = this._getUserRole(ctx);
            if (userRole != UserRole.ADMIN && userRole != UserRole.VIEWER) {
                this._sendUnauthorizedMessage(ctx);
                return;
            }

            let balance = await this.exchangeManager.fetchBalance();
            let assetList = balance.info.assets.filter(a => a.walletBalance != 0);

            let dataList = [];
            dataList.push(['Asset', 'Total', 'Free', 'Used', 'UPnL']);

            assetList.map((asset) => {
                let row = [
                    asset.asset,
                    parseFloat(balance[asset.asset].total).toFixed(2).toString(),
                    parseFloat(balance[asset.asset].free).toFixed(2).toString(),
                    parseFloat(balance[asset.asset].used).toFixed(2).toString(),
                    parseFloat(asset.unrealizedProfit).toFixed(2).toString()
                ]

                dataList.push(row);
            })

            let table = markdownTable(
                dataList,
                { align: ['l', 'c', 'c', 'c', 'c'] }
            )

            let splittedTable = table.split('\n');
            splittedTable.splice(1, 1);

            table = splittedTable.join('\n');
            table = `\`\`\`\n${table}\n\`\`\``;

            this.send(table);
        } catch (error) {
            this.logManager.error(`Fetch balance command failed.`, `Inner exception: ${error.message}`);
        }
    }

    executeVersionCommand(ctx) {
        try {
            let userRole = this._getUserRole(ctx);
            if (userRole != UserRole.ADMIN && userRole != UserRole.VIEWER) {
                this._sendUnauthorizedMessage(ctx);
                return;
            }

            let messageList = [];
            messageList = messageList.concat(`${Emoji.ROBOT} v${this.appSettings.version}`);
            let message = messageList.join('');
            this.send(message);
        } catch (error) {
            this.logManager.error(`Version command failed.`, `Inner exception: ${error.message}`);
        }
    }

    executeCloseAllPositionsCommand(ctx) {
        try {
            let userRole = this._getUserRole(ctx);
            if (userRole != UserRole.ADMIN) {
                this._sendUnauthorizedMessage(ctx);
                return;
            }

            let timestamp = new Date();
            let messageTimestamp = new Date(ctx.message.date * 1000);

            let diffInSeconds = Math.abs(timestamp - messageTimestamp) / 1000;

            if (diffInSeconds > 30) {
                this.logManager.error(`Close all positions command timed out. (30s)`, `It was probably related with telegram queue management.`);
                return;
            }

            let data = {
                authentication: {
                    bearer: this.systemUtil.getConfig('authentication.accessToken')
                },
                exchange: undefined,
                timestamp: new Date().toISOString(),
                ticker: "BTCUSDTPERP",
                timeframe: "Any",
                system_minimum_tick: 0,
                strategy: {
                    title: "Monsterader Master",
                    short_title: "MTMASTER",
                    equity: 0,
                    position_size: 0
                },
                trade: {
                    entry_price: 0,
                    stop_loss_price: 0,
                    take_profit_price: 0,
                    stop_loss_in_ticks: 0,
                    take_profit_in_ticks: 0,
                    action: "auto",
                    contracts: 0,
                    leverage: 0,
                    gross_profit: 0,
                    commission: 0,
                    net_profit: 0
                },
                type: "CLOSE_ALL",
                duoSignal: 0
            }

            let host = this.systemUtil.getConfig('webserver.host');
            let port = this.systemUtil.getConfig('webserver.port');
            let baseUrl = `${host}:${port}`;
            let serviceUrl = `${baseUrl}/signal`

            fetch(serviceUrl, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            }).then();

        } catch (error) {
            this.logManager.error(`Close all positions command failed.`, `Inner exception: ${error.message}`);
        }
    }

    _sendUnauthorizedMessage(ctx) {
        let messageList = [];
        messageList = messageList.concat(`${Emoji.RED_CIRCLE} You are not authorized to execute ${ctx.message.text} command.`);
        let message = messageList.join('');
        this.send(message);
    }

    _getUserRole(ctx) {
        let isAdmin = this._checkAdminAuthentication(ctx);

        if (isAdmin)
            return UserRole.ADMIN;

        let isViewer = this._checkViewerAuthentication(ctx);

        if (isViewer)
            return UserRole.VIEWER;

        return undefined;
    }

    _checkAdminAuthentication(ctx) {
        let admins = this.systemUtil.getConfig('communication.channel.telegram.admins');
        let username = ctx.from.username;

        let admin = admins.find(a => a == username);
        if (admin)
            return true;

        return false;
    }

    _checkViewerAuthentication(ctx) {
        let viewers = this.systemUtil.getConfig('communication.channel.telegram.viewers');
        let username = ctx.from.username;

        let viewer = viewers.find(v => v == username);
        if (viewer)
            return true;

        return false;
    }
};