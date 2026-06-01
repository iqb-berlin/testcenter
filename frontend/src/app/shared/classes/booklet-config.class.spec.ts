import { BookletConfig } from './booklet-config.class';

describe('BookletConfig migration layer', () => {
  const legacyMappings: Array<[string, string, string, string]> = [
    ['unit_navibuttons', 'OFF', 'navbar_unit_label', 'HIDDEN'],
    ['page_navibuttons', 'FULL', 'navbar_page_label', 'LIST'],
    ['unit_screenheader', 'WITH_BLOCK_TITLE', 'header_content', 'BLOCK_LABEL'],
    ['unit_title', 'OFF', 'toolbar_show_unit_title', 'FALSE'],
    ['unit_menu', 'FULL', 'toolbar_show_unit_list', 'TRUE'],
    ['show_fullscreen_button', 'ON', 'toolbar_show_fullscreen_button', 'TRUE'],
    ['show_reload_button', 'ON', 'toolbar_show_reload_button', 'TRUE'],
    ['unit_show_time_left', 'ON', 'toolbar_show_time_left', 'TRUE'],
    ['ui_mode', 'NONE', 'silent_mode', 'TRUE']
  ];

  it('uses new defaults when neither config key is set', () => {
    const config = new BookletConfig();

    expect(config.navbar_unit_label).toBe('INDEX');
    expect(config.header_content).toBe('BOOKLET_LABEL');
    expect(config.silent_mode).toBe('FALSE');
  });

  legacyMappings.forEach(([oldKey, oldValue, newKey, expectedValue]) => {
    it(`maps ${oldKey} to ${newKey}`, () => {
      const config = new BookletConfig();

      config.setFromKeyValuePairs({ [oldKey]: oldValue });

      expect((config as unknown as { [key: string]: string })[newKey]).toBe(expectedValue);
    });
  });

  it('prefers a configured new key over a configured old key', () => {
    const config = new BookletConfig();

    config.setFromKeyValuePairs({
      page_navibuttons: 'FULL',
      navbar_page_label: 'LABEL'
    });

    expect(config.navbar_page_label).toBe('LABEL');
  });

  it('loads old and new keys from XML', () => {
    const config = new BookletConfig();
    const xml = new DOMParser().parseFromString(`
      <BookletConfig>
        <Config key="unit_navibuttons">OFF</Config>
        <Config key="navbar_unit_label">LABEL</Config>
      </BookletConfig>
    `, 'text/xml');

    config.setFromXml(xml.documentElement);

    expect(config.navbar_unit_label).toBe('LABEL');
  });
});
