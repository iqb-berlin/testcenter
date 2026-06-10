import { BookletConfigData } from 'testcenter-common/classes/booklet-config-data.class';

export class BookletConfig extends BookletConfigData {
  private readonly configuredKeys = new Set<string>();

  get loading_mode() { return this._loading_mode; }
  get logPolicy() { return this._logPolicy; }
  get browserBehaviour() { return this._browserBehaviour; }
  get pagingMode() { return this._pagingMode; }
  get force_presentation_complete() { return this._force_presentation_complete; }
  get force_response_complete() { return this._force_response_complete; }
  get unit_time_left_warnings() { return this._unit_time_left_warnings; }
  get show_end_button_in_player() { return this._show_end_button_in_player; }
  get restore_current_page_on_return() { return this._restore_current_page_on_return; }
  get allow_player_to_terminate_test() { return this._allow_player_to_terminate_test; }
  get lock_test_on_termination() { return this._lock_test_on_termination; }
  get ask_for_fullscreen() { return this._ask_for_fullscreen; }
  get unit_responses_buffer_time() { return this._unit_responses_buffer_time; }
  get unit_state_buffer_time() { return this._unit_state_buffer_time; }
  get test_state_buffer_time() { return this._test_state_buffer_time; }
  get header_hidden() { return this._header_hidden; }
  get header_content() {
    return this.resolveLegacyValue(
      'header_content', 'unit_screenheader', this._header_content, this._unit_screenheader, {
        OFF: 'NONE', // this feature was canceled
        WITH_UNIT_TITLE: 'UNIT_LABEL',
        WITH_BOOKLET_TITLE: 'BOOKLET_LABEL',
        WITH_BLOCK_TITLE: 'BLOCK_LABEL',
        EMPTY: 'NONE'
      }
    );
  }

  get navbar_unit_label() {
    return this.resolveLegacyValue(
      'navbar_unit_label', 'unit_navibuttons', this._navbar_unit_label, this._unit_navibuttons, {
        OFF: 'HIDDEN',
        INDEX: 'INDEX',
        LABEL: 'LABEL'
      }
    );
  }

  get navbar_unit_controls_hidden() { return this._navbar_unit_controls_hidden; }
  get navbar_page_label() {
    return this.resolveLegacyValue(
      'navbar_page_label', 'page_navibuttons', this._navbar_page_label, this._page_navibuttons, {
        OFF: 'HIDDEN',
        INDEX: 'INDEX',
        FULL: 'LIST'
      }
    );
  }

  get navbar_page_controls_hidden() { return this._navbar_page_controls_hidden; }
  get navbar_backward_button() { return this._navbar_backward_button; }
  get navbar_forward_button() { return this._navbar_forward_button; }
  get toolbar_show_unit_title() {
    return this.resolveLegacyValue(
      'toolbar_show_unit_title', 'unit_title', this._toolbar_show_unit_title, this._unit_title,
      { OFF: 'FALSE', ON: 'TRUE' }
    );
  }

  get toolbar_show_unit_list() {
    return this.resolveLegacyValue(
      'toolbar_show_unit_list', 'unit_menu', this._toolbar_show_unit_list, this._unit_menu,
      { OFF: 'FALSE', FULL: 'TRUE' }
    );
  }

  get toolbar_show_fullscreen_button() {
    return this.resolveLegacyValue(
      'toolbar_show_fullscreen_button', 'show_fullscreen_button',
      this._toolbar_show_fullscreen_button, this._show_fullscreen_button, {
        OFF: 'FALSE',
        ON: 'TRUE'
      }
    );
  }

  get toolbar_show_reload_button() {
    return this.resolveLegacyValue(
      'toolbar_show_reload_button', 'show_reload_button',
      this._toolbar_show_reload_button, this._show_reload_button, { OFF: 'FALSE', ON: 'TRUE' }
    );
  }

  get toolbar_show_time_left() {
    return this.resolveLegacyValue(
      'toolbar_show_time_left', 'unit_show_time_left',
      this._toolbar_show_time_left, this._unit_show_time_left, { OFF: 'FALSE', ON: 'TRUE' }
    );
  }

  get silent_mode() {
    return this.resolveLegacyValue('silent_mode', 'ui_mode', this._silent_mode, this._ui_mode, {
      ALL: 'FALSE',
      NONE: 'TRUE'
    });
  }

  get page_navibuttons() { return this._page_navibuttons; }
  get unit_navibuttons() { return this._unit_navibuttons; }
  get unit_menu() { return this._unit_menu; }
  get unit_screenheader() { return this._unit_screenheader; }
  get unit_title() { return this._unit_title; }
  get unit_show_time_left() { return this._unit_show_time_left; }
  get show_fullscreen_button() { return this._show_fullscreen_button; }
  get show_reload_button() { return this._show_reload_button; }
  get ui_mode() { return this._ui_mode; }

  setFromKeyValuePairs(config: { [key: string]: string }): void {
    Object.keys(config)
      .forEach(key => {
        const field = `_${key}`;
        if (field in this) {
          (this as unknown as { [field: string]: string })[field] = config[key];
          this.configuredKeys.add(key);
        }
      });
  }

  toEntries(): Array<[string, string]> {
    return Object.entries(this)
      .filter(([key, value]) => key.startsWith('_') && typeof value === 'string')
      .map(([key, value]) => [key.substring(1), value]);
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

  private resolveLegacyValue<
    OldValue extends string,
    NewValue extends string
  >(
    newKey: string,
    oldKey: string,
    newValue: NewValue,
    oldValue: OldValue,
    legacyValues: Record<OldValue, NewValue>
  ): NewValue {
    // if both are set explicitly, newKey always wins; when neither is set, newKey default also wins
    if (this.configuredKeys.has(newKey) || !this.configuredKeys.has(oldKey)) {
      return newValue;
    }

    // only when newKey is not set AND oldKey is set, does the value of oldKey win
    return legacyValues[oldValue];
  }
}
