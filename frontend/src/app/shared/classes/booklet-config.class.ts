import { BookletConfigData } from 'testcenter-common/classes/booklet-config-data.class';

export class BookletConfig extends BookletConfigData {
  setFromKeyValuePairs(config: { [key: string]: string }): void {
    Object.keys(config)
      .forEach(key => {
        if (this[key]) {
          this[key] = config[key];
        }
      });
  }

  setFromXml(bookletConfigElement: Element): void {
    const bookletConfigs = Array.prototype.slice.call(bookletConfigElement.childNodes)
      .filter(e => e.nodeType === 1)
      .reduce(
        (agg, item) => {
          agg[item.getAttribute('key')] = item.textContent;
          return agg;
        },
        {}
      );
    this.setFromKeyValuePairs(bookletConfigs);
  }
}
