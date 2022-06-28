import dotenv from 'dotenv';

import { boot } from './src/modules/services.js';
import TradeServerCommand from './src/command/trade_server.js';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
const __dirname = dirname(fileURLToPath(import.meta.url));

async function start() {
    await boot(__dirname);

    const cmd = new TradeServerCommand();
    cmd.execute();
}

start();