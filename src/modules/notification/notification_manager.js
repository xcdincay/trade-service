import Emoji from '../../dict/emoji.js';
import LogType from '../../dict/log_type.js';
import TradeType from '../../dict/trade_type.js';
import TradeOption from '../../dict/trade_option.js';

export default class NotificationManager {
  static get UNDEFINED() {
    return 'Undefined';
  }

  constructor(clients, config, systemUtil) {
    this.clients = clients;
    this.config = config;
    this.systemUtil = systemUtil;
  }

  send(message) {
    this.clients.forEach(client => client.send(message));
  }

  notifyBalance(balance) {
    return new Promise((resolve, reject) => {
      try {
        let table = this.systemUtil.prepareBalanceTable(balance);
        this.send(table);

        resolve(table);
      } catch (error) {
        reject(error);
      }
    }).catch((error) => {
      console.error(error)
    });
  }

  notifyLog(log) {
    return new Promise((resolve, reject) => {
      try {
        let shouldSendMessage = this.config.log.levels.find(x => x === log.type) ? true : false;

        if (!shouldSendMessage) {
          return;
        }

        let textAndEmoji = this._getLogTypeTextAndEmoji(log.type);

        let messageList = [];
        messageList = messageList.concat(`${textAndEmoji.emoji} *${textAndEmoji.type ?? NotificationManager.UNDEFINED}:* ${log.title ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Timestamp:* ${log.timestamp ?? NotificationManager.UNDEFINED}`);

        if (log.message)
          messageList = messageList.concat(`*Message:* ${log.message}`);

        let message = messageList.join('\n');
        this.send(message);
        resolve(message);
      } catch (error) {
        reject(error);
      }
    }).catch((error) => {
      console.error(error)
    });
  }

  notifySignal(signal) {
    return new Promise((resolve, reject) => {
      try {
        let type = this._getSignalTypeText(signal.type);
        let action = this._getSignalActionText(signal.trade.action);

        let messageList = [];
        messageList = messageList.concat(`${Emoji.BELLHOP_BELL} *TradingView:* ${type ?? NotificationManager.UNDEFINED} ${signal.ticker ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Strategy:* ${signal.strategy.title ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Timestamp:* ${signal.timestamp ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Received Timestamp:* ${signal.instanceTimestamp ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Timeframe:* ${signal.timeframe ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Action:* ${action ?? NotificationManager.UNDEFINED}`);

        let message = messageList.join('\n');
        this.send(message);
        resolve();
      } catch (error) {
        reject(error);
      }
    }).catch((error) => {
      console.error(error)
    });
  }

  notifyTradeEntry(tradeEntry) {
    return new Promise((resolve, reject) => {
      try {
        let action = this._getSignalActionText(tradeEntry.action);
        let marginType = this._getMarginTypeText(tradeEntry.marginType);

        let messageList = [];
        messageList = messageList.concat(`${Emoji.SEEDLING} *${tradeEntry.exchange}:* ${action ?? NotificationManager.UNDEFINED} ${tradeEntry.ticker ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Before Order:* ${tradeEntry.timestampBeforeOrderCreation ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*After Order:* ${tradeEntry.timestampAfterOrderCreation ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Cost:* ${tradeEntry.cost ?? NotificationManager.UNDEFINED} ${tradeEntry.currency ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Contract:* ${tradeEntry.contract ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Signal Contract:* ${tradeEntry.signalContract ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Entry Price:* ${tradeEntry.entryPrice ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Signal Entry Price:* ${tradeEntry.signalEntryPrice ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Fee:* ${tradeEntry.feeCost ?? NotificationManager.UNDEFINED} ${tradeEntry.currency ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Leverage:* ${tradeEntry.leverage ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Signal Leverage:* ${tradeEntry.signalLeverage ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Margin Type:* ${marginType ?? NotificationManager.UNDEFINED}`);

        let message = messageList.join('\n');
        this.send(message);
        resolve(message);
      } catch (error) {
        reject(error)
      }
    }).catch((error) => {
      console.error(error)
    });
  }

  notifyTradeClose(tradeClose) {
    return new Promise((resolve, reject) => {
      try {
        let action = this._getSignalActionText(tradeClose.action);
        let marginType = this._getMarginTypeText(tradeClose.marginType);

        let emoji = tradeClose.pnl > 0 ? Emoji.ROCKET : tradeClose.pnl < 0 ? Emoji.DROP_OF_BLOOD : Emoji.DNA;

        let messageList = [];
        messageList = messageList.concat(`${emoji} *${tradeClose.exchange}:* ${action ?? NotificationManager.UNDEFINED} ${tradeClose.ticker ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Before Order:* ${tradeClose.timestampBeforeOrderCreation ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*After Order:* ${tradeClose.timestampAfterOrderCreation ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*PnL:* ${tradeClose.pnl ?? NotificationManager.UNDEFINED} ${tradeClose.currency ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Contract:* ${tradeClose.contract ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Signal Contract:* ${tradeClose.signalContract ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Entry Price:* ${tradeClose.entryPrice ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Close Price:* ${tradeClose.closePrice ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Signal Close Price:* ${tradeClose.signalClosePrice ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Close Reason:* ${tradeClose.closeReason ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Entry Order Creation:* ${tradeClose.since ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Fee* ${tradeClose.feeCost ?? NotificationManager.UNDEFINED} ${tradeClose.currency ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Leverage:* ${tradeClose.leverage ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Signal Leverage:* ${tradeClose.signalLeverage ?? NotificationManager.UNDEFINED}`);
        messageList = messageList.concat(`*Margin Type:* ${marginType ?? NotificationManager.UNDEFINED}`);

        let message = messageList.join('\n');
        this.send(message);
        resolve(message);
      } catch (error) {
        reject(error);
      }
    }).catch((error) => {
      console.error(error)
    });
  }

  _getLogTypeTextAndEmoji(type) {
    let emoji;
    let typeText;

    switch (type) {
      case LogType.ERROR:
        typeText = 'Error';
        emoji = Emoji.RED_CIRCLE;
        break;
      case LogType.CRITICAL:
        typeText = 'Critical';
        emoji = Emoji.RED_CIRCLE;
        break;
      case LogType.CRITICAL_SUCCESS:
        typeText = 'Critical';
        emoji = Emoji.GREEN_CIRCLE;
        break;
      case LogType.WARNING:
        typeText = 'Warning';
        emoji = Emoji.YELLOW_CIRCLE;
        break;
      case LogType.INFO:
        typeText = 'Info';
        emoji = Emoji.BLUE_CIRCLE;
        break;
      case LogType.SUCCESS:
        typeText = 'Success';
        emoji = Emoji.GREEN_CIRCLE;
        break;
      default:
        typeText = NotificationManager.UNDEFINED;
        emoji = Emoji.WHITE_CIRCLE;
        break;
    }

    return {
      emoji: emoji,
      type: typeText
    }
  }

  _getSignalTypeText(signalType) {
    let result;

    switch (signalType) {
      case TradeType.BUY:
        result = 'Buy';
        break;
      case TradeType.SELL:
        result = 'Sell';
        break;
      case TradeType.CLOSE_BUY:
        result = 'Close buy';
        break;
      case TradeType.CLOSE_SELL:
        result = 'Close sell';
        break;
      case TradeType.CLOSE_ALL:
        result = 'Close all';
        break;
      case TradeType.SLTP:
        result = 'Stop loss or take profit';
        break;
      default:
        result = NotificationManager.UNDEFINED;
    }

    return result;
  }

  _getSignalActionText(action) {
    let result;

    switch (action) {
      case 'buy':
        result = 'Buy';
        break;
      case 'sell':
        result = 'Sell';
        break;
      case 'auto':
        result = 'Auto';
        break;
      default:
        result = NotificationManager.UNDEFINED;
    }

    return result;
  }

  _getMarginTypeText(marginType) {
    let result;

    switch (marginType) {
      case TradeOption.ISOLATED_MARGIN:
        result = 'Isolated';
        break;
      case TradeOption.CROSSED_MARGIN:
        result = 'Cross';
        break;
      default:
        result = NotificationManager.UNDEFINED;
    }

    return result;
  }
};