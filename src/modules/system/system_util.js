import { markdownTable } from 'markdown-table';
import lodash from 'lodash';
const { get } = lodash;

export default class SystemUtil {
  constructor(config) {
    this.config = config;
  }

  getConfig(key, defaultValue = undefined) {
    const value = get(this.config, key, defaultValue);

    if (value === null) {
      return defaultValue;
    }

    return value;
  }

  prepareBalanceTable(balance) {
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

    return table;
  }

  generateTimesFromInterval(interval) {
    if (!interval)
      return [];

    let dayInMinutes = 24 * 60;
    let size = typeof interval == 'number' ? interval : dayInMinutes;

    let tt = 0;
    let ap = ['AM', 'PM'];

    let times = [];

    for (let i = 0; tt < dayInMinutes; i++) {
      let hh = Math.floor(tt / 60);
      let mm = (tt % 60);
      let time12h = ("0" + (hh % 12)).slice(-2) + ":" + ("0" + mm).slice(-2) + ":00 " + ap[Math.floor(hh / 12)];
      let time24h = this.convertTime12to24(time12h);
      times[i] = this._convertTimeToTodaysDate(time24h);
      tt = tt + size;
    }

    return (times);
  }

  convertTime12to24(time12h) {
    const [time, modifier] = time12h.split(' ');

    let [hours, minutes] = time.split(':');

    if (hours === '12') {
      hours = '00';
    }

    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }

    return `${hours}:${minutes}:00`;
  }

  _convertTimeToTodaysDate(time24h) {
    let today = new Date();

    let isoDateString =
      today.getUTCFullYear() + "-" +
      this._convertToTwoDigits(today.getUTCMonth() + 1) + "-" +
      this._convertToTwoDigits(today.getUTCDate()) + "T" +
      time24h + "+00:00";

    let date = new Date(isoDateString);
    return date;
  }

  _convertToTwoDigits(number) {
    return ("0" + number).slice(-2);
  }
};