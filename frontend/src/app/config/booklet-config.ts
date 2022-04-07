import bookletConfigData from './booklet-config-data.json';

type BookletConfigType = {
  [name in keyof typeof bookletConfigData]: keyof typeof bookletConfigData[name]['options']
} & {
  new(): BookletConfigType;
  setFromKeyValuePairs(config: { [key: string]: string }): void;
  setFromXml(bookletConfigElement: Element): void;
};

const BookletConfigConstructor = function BookletConfigPrototype() {
  Object.keys(bookletConfigData)
    .forEach(key => {
      this[key] = bookletConfigData[key].defaultvalue;
    });

  this.setFromKeyValuePairs = (config: { [key: string]: string }): void => {
    Object.keys(config)
      .forEach(key => {
        if (this[key]) {
          this[key] = config[key];
        }
      });
  };

  this.setFromXml = (bookletConfigElement: Element): void => {
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
  };
};

/**
 * we can make an claim about the type of this class, because we know, it has implemented all booklet-config-as members
 * it enables typehinting and such.
 */

export const BookletConfig = BookletConfigConstructor as unknown as BookletConfigType;
