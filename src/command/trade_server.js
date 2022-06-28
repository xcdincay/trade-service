import { createWebserverInstance } from '../modules/services.js';

export default class TradeServerCommand {
  constructor() {}

  execute() {
    createWebserverInstance().start();
  }
};
