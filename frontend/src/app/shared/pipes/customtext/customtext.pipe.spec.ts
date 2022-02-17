import { CustomtextPipe } from './customtext.pipe';
import { CustomtextService } from '../../services/customtext/customtext.service';

describe('CustomtextPipe', () => {
  it('transforms texts correctly', () => {
    const cts = new CustomtextService();
    cts.addCustomTexts({
      key1: 'value-1',
      key2: 'value-2'
    });
    const pipe = new CustomtextPipe(cts);
    pipe.transform('default value', 'key1')
      .subscribe(displayedText => expect(displayedText).toEqual('value-1'));
    pipe.transform('', 'key2')
      .subscribe(displayedText => expect(displayedText).toEqual('value-2'));
    pipe.transform('default value', 'unregistered_key')
      .subscribe(displayedText => expect(displayedText).toEqual('default value'));
    pipe.transform('', 'unregistered_key')
      .subscribe(displayedText => expect(displayedText).toEqual('unregistered_key'));
  });

  it('uses replacement parameters correctly', () => {
    const cts = new CustomtextService();
    cts.addCustomTexts({
      oneToken: 'Replace this: %s',
      twoTokens: 'Replace two things: %s, %s',
      noToken: 'Replace nothing'
    });
    const pipe = new CustomtextPipe(cts);
    pipe.transform('default value', 'oneToken', '1st')
      .subscribe(displayedText => expect(displayedText).toEqual('Replace this: 1st'));
    pipe.transform('default value', 'oneToken')
      .subscribe(displayedText => expect(displayedText).toEqual('Replace this: %s'));
    pipe.transform('default value', 'oneToken', '1st', '2nd')
      .subscribe(displayedText => expect(displayedText).toEqual('Replace this: 1st'));
    pipe.transform('default value', 'twoTokens', '1st')
      .subscribe(displayedText => expect(displayedText).toEqual('Replace two things: 1st, %s'));
    pipe.transform('default value', 'twoTokens')
      .subscribe(displayedText => expect(displayedText).toEqual('Replace two things: %s, %s'));
    pipe.transform('default value', 'twoTokens', '1st', '2nd')
      .subscribe(displayedText => expect(displayedText).toEqual('Replace two things: 1st, 2nd'));
    pipe.transform('default value', 'noToken', '1st')
      .subscribe(displayedText => expect(displayedText).toEqual('Replace nothing'));
  });
});
