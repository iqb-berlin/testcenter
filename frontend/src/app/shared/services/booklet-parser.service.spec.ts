import { TestBed } from '@angular/core/testing';
import { CalculatorConfiguration } from 'testcenter-common/interfaces/calculator.interfaces';
import { AppError } from '../../app.interfaces';
import { BookletService } from '../../group-monitor/booklet/booklet.service';
import { BackendService as MonitorBackendService } from '../../group-monitor/backend.service';
import { Testlet as MonitorTestlet } from '../../group-monitor/group-monitor.interfaces';
import { Testlet as ControllerTestlet } from '../../test-controller/interfaces/test-controller.interfaces';
import { BackendService as ControllerBackendService } from '../../test-controller/services/backend.service';
import { TestControllerService } from '../../test-controller/services/test-controller.service';
import { TestLoaderService } from '../../test-controller/services/test-loader.service';
import { CustomtextService } from './customtext/customtext.service';

type Testlet = ControllerTestlet | MonitorTestlet;

function booklet(contents: string): string {
  return `<Booklet><Metadata><Id>test</Id><Label>Calculator test</Label></Metadata>
    <Units>${contents}</Units></Booklet>`;
}

function block(contents: string): string {
  return booklet(`<Testlet id="outer">${contents}<Unit id="u1" label="Task"/></Testlet>`);
}

function findTestlet(root: Testlet, id: string): Testlet {
  const collect = (node: Testlet): Testlet[] => [node, ...node.children.flatMap(child =>
    'children' in child ? collect(child) : [])];
  const result = collect(root).find(testlet => testlet.id === id);
  if (!result) throw new Error(`Missing testlet ${id}`);
  return result;
}

const defaults: CalculatorConfiguration = {
  mode: 'SIMPLE', journalLines: 0, maxImageWidthPx: 200, journal: '[]'
};

const consumers = [
  { name: 'Testcontroller', fullValidation: true, create: () => TestBed.inject(TestLoaderService) },
  { name: 'group monitor', fullValidation: false, create: () => TestBed.inject(BookletService) }
];

for (const consumer of consumers) {
  describe(`${consumer.name} calculator booklet parsing`, () => {
    let parser: TestLoaderService | BookletService;
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          TestLoaderService, BookletService,
          // Parsing uses both real adapters; their controller and network dependencies are unused.
          { provide: TestControllerService, useValue: {} },
          { provide: ControllerBackendService, useValue: {} },
          { provide: MonitorBackendService, useValue: {} },
          { provide: CustomtextService, useValue: {} }
        ]
      });
      parser = consumer.create();
    });

    it('distinguishes absent calculator configuration from an empty declaration', () => {
      expect(findTestlet(parser.parseBookletXml(block('')).units, 'outer').calculator).toBeUndefined();
      expect(findTestlet(parser.parseBookletXml(block('<Calculator/>')).units, 'outer').calculator).toEqual(defaults);
    });

    it('parses all settings and preserves journal text and entry order', () => {
      const journal = JSON.stringify([
        { asLatex: '\\frac{1}{3}<2 & 3', asImage: 'data:image/png;base64,aW1hZ2U=' },
        { asLatex: '2+2=4', asImage: '' }
      ], null, 2);
      const result = parser.parseBookletXml(block(`<Calculator mode="SCIENTIFIC"
        journalLines="7" maxImageWidthPx="300"><Journal><![CDATA[${journal}]]></Journal></Calculator>`));
      expect(findTestlet(result.units, 'outer').calculator).toEqual({
        mode: 'SCIENTIFIC', journalLines: 7, maxImageWidthPx: 300, journal
      });
    });

    it('attaches configuration only to direct units and supports explicit child declarations', () => {
      const result = parser.parseBookletXml(booklet(`<Testlet id="outer"><Restrictions/><Calculator/>
        <Unit id="u1" label="Task"/>
        <Testlet id="absent"><Unit id="u2" label="Task"/></Testlet>
        <Testlet id="explicit"><Calculator mode="SCIENTIFIC"/><Unit id="u3" label="Task"/></Testlet>
      </Testlet>`));
      const parent = findTestlet(result.units, 'outer');
      expect(parent.calculator).toEqual(defaults);
      expect(findTestlet(result.units, 'absent').calculator).toBeUndefined();
      expect(findTestlet(result.units, 'explicit').calculator?.mode).toBe('SCIENTIFIC');
      const unit = parent.children[0];
      if ('parent' in unit) expect(unit.parent.calculator).toEqual(defaults);
    });

    it('accepts XML integer lexical forms without losing precision', () => {
      const result = parser.parseBookletXml(block(`<Calculator
        journalLines=" +0002 " maxImageWidthPx="9007199254740991"/>`));
      expect(findTestlet(result.units, 'outer').calculator).toEqual({
        ...defaults, journalLines: 2, maxImageWidthPx: Number.MAX_SAFE_INTEGER
      });
    });

    for (const attribute of ['journalLines', 'maxImageWidthPx']) {
      it(`rejects ${attribute} beyond JavaScript integer precision with testlet context`, () => {
        expect(() => parser.parseBookletXml(block(
          `<Calculator ${attribute}="9007199254740992"/>`
        ))).toThrowMatching((error: unknown) =>
          error instanceof AppError && error.type === 'xml' && error.description.includes('outer'));
      });
    }

    const invalidJournals = ['', ' ', 'invalid', '{}', 'null', '[null]', '[[]]', '[1]',
      '[{"asLatex":"x"}]', '[{"asLatex":"x","asImage":null}]', '[{"asLatex":0,"asImage":""}]',
      '[{"asLatex":"valid","asImage":""},null]'];
    for (const journal of consumer.fullValidation ? invalidJournals : ['invalid']) {
      it(`rejects invalid journal ${JSON.stringify(journal)}`, () => {
        expect(() => parser.parseBookletXml(block(
          `<Calculator><Journal>${journal}</Journal></Calculator>`
        ))).toThrowMatching((error: unknown) =>
          error instanceof AppError && error.type === 'xml' && error.description.includes('Journal'));
      });
    }

    it('does not retain configuration between booklets', () => {
      parser.parseBookletXml(block('<Calculator mode="SCIENTIFIC"/>'));
      expect(findTestlet(parser.parseBookletXml(block('')).units, 'outer').calculator).toBeUndefined();
    });
  });
}

describe('Group-monitor calculator error result', () => {
  it('returns an XML error for an invalid calculator journal', () => {
    TestBed.configureTestingModule({
      providers: [BookletService, { provide: MonitorBackendService, useValue: {} }]
    });
    expect(TestBed.inject(BookletService).parseXml(block('<Calculator><Journal>invalid</Journal></Calculator>')))
      .toEqual({ error: 'xml', species: null });
  });
});
