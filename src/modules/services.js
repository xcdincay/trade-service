import { readFileSync } from 'fs';

import { Telegraf } from 'telegraf';

import SystemUtil from '../modules/system/system_util.js';
import Http from '../modules/http.js';

import Telegram from '../modules/notification/telegram.js';
import NotificationManager from '../modules/notification/notification_manager.js';
import ExchangeManager from '../modules/exchange/exchange_manager.js';
import BinanceUsdmFutures from '../exchange/binance_usdm_futures.js';

import LogManager from '../modules/log/log_manager.js';

import TradeManager from '../modules/trade/trade_manager.js';
import SignalListener from '../modules/listener/signal_listener.js';
import SignalQueueManager from './queue/signal_queue_manager.js';
import SignalDispatcher from '../modules/dispatcher/signal_dispatcher.js';

let config;
let appSettings;
let systemUtil;

let telegraf;
let telegram;
let notificationManager;
let exchangeManager;

let logManager;

let tradeManager;
let signalListener;
let signalQueueManager;
let signalDispatcher;

const parameters = {};

export function getConfig() {
  return config;
}

export function getAppSettings() {
  return appSettings;
}

export async function boot(projectDir) {
  let configFileName = process.env.NX_CONFIG_FILE_NAME;
  parameters.projectDir = projectDir;

  try {
    config = JSON.parse(readFileSync(`${parameters.projectDir}/${configFileName}`, 'utf8'));
    appSettings = JSON.parse(readFileSync(`${parameters.projectDir}/package.json`, 'utf8'));
  } catch (e) {
    throw new Error(`Invalid config file. Please check: ${String(e)}`);
  }
}

export function getSystemUtil(config) {
  if (systemUtil) {
    return systemUtil;
  }

  return (systemUtil = new SystemUtil(getConfig()));
}

export function configureServices() {
  getTelegraf();
  getTelegram();
  getNotificationManager();
  getExchangeManager().init();

  getLogManager();

  getTradeManager();
  getSignalListener();
  getSignalQueueManager().init();
  getSignalDispatcher();

  telegram.setExchangeManager(exchangeManager);
  telegram.setTradeManager(tradeManager);
  telegram.setLogManager(logManager);

  signalDispatcher.setLogManager(logManager);
}

export function createWebserverInstance() {
  configureServices();

  return new Http(
    getSystemUtil(),
    getAppSettings(),
    getSignalDispatcher(),
    getLogManager(),
    parameters.projectDir
  );
}

export function getTelegraf() {
  if (telegraf)
    return telegraf;

  const config = getConfig();
  const { token } = config.communication.channel.telegram;

  if (!token) {
    return;
  }

  return (telegraf = new Telegraf(token));
}

export function getTelegram() {
  if (telegram)
    return telegram;

  const config = getConfig();
  const telegramConfig = config.communication.channel.telegram;

  if ((telegramConfig && telegramConfig.enabled) &&
    (telegramConfig.chatId && telegramConfig.chatId.length > 0 && telegramConfig.token && telegramConfig.token.length > 0)) {
    return (telegram = new Telegram(getTelegraf(), telegramConfig, getAppSettings(), getSystemUtil()));
  }

  return null;
}

export function getNotificationManager() {
  if (notificationManager) {
    return notificationManager;
  }

  const clients = [];
  let myTelegram = getTelegram();

  if (myTelegram)
    clients.push(myTelegram);

  return (notificationManager = new NotificationManager(clients, config.communication));
}

export function getExchangeManager() {
  if (exchangeManager) {
    return exchangeManager;
  }

  return (exchangeManager = new ExchangeManager(new BinanceUsdmFutures(), getConfig()));
}

export function getLogManager() {
  if (logManager) {
    return logManager;
  }

  const config = getConfig();
  const logConfig = config.communication.log;

  return (logManager = new LogManager(logConfig, getNotificationManager()));
}

export function getTradeManager() {
  if (tradeManager) {
    return tradeManager;
  }

  return (tradeManager = new TradeManager(getExchangeManager(), getNotificationManager(), getLogManager(), getSystemUtil()));
}

export function getSignalListener() {
  if (signalListener) {
    return signalListener;
  }

  return (signalListener = new SignalListener(getTradeManager(), getNotificationManager(), getLogManager()));
}

export function getSignalQueueManager() {
  if (signalQueueManager) {
    return signalQueueManager;
  }

  return (signalQueueManager = new SignalQueueManager(getSignalListener(), getLogManager()));
}

export function getSignalDispatcher() {
  if (signalDispatcher) {
    return signalDispatcher;
  }

  return (signalDispatcher = new SignalDispatcher(getSignalQueueManager()));
}