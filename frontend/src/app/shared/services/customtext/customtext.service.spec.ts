import { TestBed } from '@angular/core/testing';
import { CustomtextService } from './customtext.service';

describe('CustomtextService', () => {
  let customtextService: CustomtextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    customtextService = TestBed.inject(CustomtextService);
  });

  it('returns on subscribeCustomText for each key an observable, wich gets updated on every key-update', async () => {
    const receivedCustomTexts = {
      key: <(string | null)[]>[],
      later_subscribed_key: <(string | null)[]>[],
      unknown_key: <(string | null)[]>[],
      later_set_key: <(string | null)[]>[]
    };
    customtextService.getCustomText$('key')
      .subscribe(customText => receivedCustomTexts.key.push(customText));
    customtextService.getCustomText$('unknown_key')
      .subscribe(customText => receivedCustomTexts.unknown_key.push(customText));
    customtextService.getCustomText$('later_set_key')
      .subscribe(customText => receivedCustomTexts.later_set_key.push(customText));

    customtextService.addCustomTexts({
      key: 'value-1-init',
      later_subscribed_key: 'value-2-init'
    });

    await new Promise<void>(resolve => {
      setTimeout(() => {
        customtextService.addCustomTexts({
          key: 'value-1-1st-update',
          later_subscribed_key: 'value-2-1st-update',
          later_set_key: 'value-3-init'
        });
        resolve();
      }, 1);
    });

    customtextService.getCustomText$('later_subscribed_key')
      .subscribe(customText => receivedCustomTexts.later_subscribed_key.push(customText));

    customtextService.addCustomTextsFromDefs({
      key: { defaultvalue: 'value-1-2nd-update', label: '' },
      later_subscribed_key: { defaultvalue: 'value-2-2nd-update', label: '' },
      later_set_key: { defaultvalue: 'value-3-1st-update', label: '' }
    });

    const expectedCustomTexts = {
      key: <(string | null)[]>[null, 'value-1-init', 'value-1-1st-update', 'value-1-2nd-update'],
      later_subscribed_key: <(string | null)[]>['value-2-1st-update', 'value-2-2nd-update'],
      unknown_key: <(string | null)[]>[null],
      later_set_key: <(string | null)[]>[null, 'value-3-init', 'value-3-1st-update']
    };

    expect(expectedCustomTexts).toEqual(receivedCustomTexts);
  });

  it('returns on getCustomText the current value', () => {
    expect(customtextService.getCustomText('key')).toEqual('');

    customtextService.addCustomTexts({
      key: 'value-1-init'
    });

    expect(customtextService.getCustomText('key')).toEqual('value-1-init');

    customtextService.addCustomTexts({
      key: 'value-1-1st-update'
    });

    expect(customtextService.getCustomText('key')).toEqual('value-1-1st-update');
  });
});
