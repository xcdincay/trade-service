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
};
