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
  show: 'yes', mode: 'SIMPLE', journalLines: 0, maxImageWidthPx: 200, journal: '[]'
};

const consumers = [
  { name: 'Testcontroller', create: () => TestBed.inject(TestLoaderService) },
  { name: 'group monitor', create: () => TestBed.inject(BookletService) }
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

    it('keeps existing booklets without calculator declarations unchanged', () => {
      const result = parser.parseBookletXml(booklet(`
        <Restrictions><DenyNavigationOnIncomplete presentation="ON"/></Restrictions>
        <Unit id="root-unit" label="Root"/>
        <Testlet id="outer"><Restrictions><CodeToEnter code="start"/></Restrictions>
          <Testlet id="inner"><Unit id="u1" label="Task"/></Testlet>
        </Testlet>`));
      expect(Object.hasOwn(result.units, 'calculator')).toBeFalse();
      expect(Object.hasOwn(findTestlet(result.units, 'outer'), 'calculator')).toBeFalse();
      expect(Object.hasOwn(findTestlet(result.units, 'inner'), 'calculator')).toBeFalse();
      expect(findTestlet(result.units, 'inner').restrictions.denyNavigationOnIncomplete?.presentation).toBe('ON');
    });

    for (const show of ['yes', 'no'] as const) {
      it(`applies defaults with show="${show}"`, () => {
        const result = parser.parseBookletXml(block(`<Calculator show="${show}"/>`));
        expect(findTestlet(result.units, 'outer').calculator).toEqual({ ...defaults, show });
      });
    }

    it('parses all settings and preserves journal text and entry order', () => {
      const journal = JSON.stringify([
        { asLatex: '\\frac{1}{3}<2 & 3', asImage: 'data:image/png;base64,aW1hZ2U=' },
        { asLatex: '2+2=4', asImage: '' }
      ], null, 2);
      const result = parser.parseBookletXml(block(`<Calculator show="yes" mode="SCIENTIFIC"
        journalLines="7" maxImageWidthPx="300"><Journal><![CDATA[${journal}]]></Journal></Calculator>`));
      expect(findTestlet(result.units, 'outer').calculator).toEqual({
        show: 'yes', mode: 'SCIENTIFIC', journalLines: 7, maxImageWidthPx: 300, journal
      });
    });

    it('inherits the nearest whole declaration, including hiding, replacement and re-enabling', () => {
      const result = parser.parseBookletXml(booklet(`
        <Testlet id="outer">
          <Calculator show="yes" mode="SCIENTIFIC" journalLines="5" maxImageWidthPx="500">
            <Journal>[{"asLatex":"1=1","asImage":""}]</Journal>
          </Calculator>
          <Testlet id="inherits"><Testlet id="deep"><Unit id="u1" label="Task"/></Testlet></Testlet>
          <Testlet id="override"><Calculator show="yes"/>
            <Testlet id="inherits-override"><Unit id="u2" label="Task"/></Testlet>
          </Testlet>
          <Testlet id="disabled"><Calculator show="no"/>
            <Testlet id="inherits-disabled"><Unit id="u3" label="Task"/></Testlet>
            <Testlet id="reenabled"><Calculator show="yes"/><Unit id="u4" label="Task"/></Testlet>
          </Testlet>
          <Testlet id="sibling"><Unit id="u5" label="Task"/></Testlet>
        </Testlet>
        <Testlet id="unrelated"><Unit id="u6" label="Task"/></Testlet>`));
      const outer = findTestlet(result.units, 'outer').calculator;
      for (const id of ['inherits', 'deep', 'sibling']) {
        expect(findTestlet(result.units, id).calculator).withContext(id).toEqual(outer);
      }
      for (const id of ['override', 'inherits-override', 'reenabled']) {
        expect(findTestlet(result.units, id).calculator).withContext(id).toEqual(defaults);
      }
      for (const id of ['disabled', 'inherits-disabled']) {
        expect(findTestlet(result.units, id).calculator).withContext(id).toEqual({ ...defaults, show: 'no' });
      }
      expect(findTestlet(result.units, 'unrelated').calculator).toBeUndefined();
    });

    it('accepts a declaration after restrictions and exposes configuration through the unit parent', () => {
      const result = parser.parseBookletXml(block('<Restrictions/><Calculator show="yes"/>'));
      const testlet = findTestlet(result.units, 'outer');
      expect(testlet.calculator).toEqual(defaults);
      const unit = testlet.children[0];
      if ('parent' in unit) expect(unit.parent.calculator).toEqual(defaults);
    });

    it('accepts XML integer lexical forms without losing precision', () => {
      const result = parser.parseBookletXml(block(`<Calculator show="yes"
        journalLines=" +0002 " maxImageWidthPx="9007199254740991"/>`));
      expect(findTestlet(result.units, 'outer').calculator).toEqual({
        ...defaults, journalLines: 2, maxImageWidthPx: Number.MAX_SAFE_INTEGER
      });
    });

    const invalidDeclarations = [
      '<Calculator/>', '<Calculator show=""/>', '<Calculator show="y"/>',
      '<Calculator show="n"/>', '<Calculator show="true"/>', '<Calculator show="YES"/>',
      '<Calculator enabled="y"/>', '<Calculator show="yes" mode="simple"/>',
      '<Calculator show="yes" mode=""/>', '<Calculator show="yes" unknown="value"/>',
      '<Calculator show="yes" journalLines="-1"/>', '<Calculator show="yes" journalLines="1.5"/>',
      '<Calculator show="yes" journalLines="1e2"/>', '<Calculator show="yes" journalLines=""/>',
      '<Calculator show="yes" journalLines="9007199254740992"/>',
      '<Calculator show="yes" maxImageWidthPx="0"/>', '<Calculator show="yes" maxImageWidthPx="-1"/>',
      '<Calculator show="yes" maxImageWidthPx="NaN"/>', '<Calculator show="yes" maxImageWidthPx="1.1"/>',
      '<Calculator show="yes"/><Calculator show="no"/>',
      '<Calculator show="yes"><Journal>[]</Journal><Journal>[]</Journal></Calculator>',
      '<Calculator show="yes"><Unknown/></Calculator>', '<Calculator show="yes">[]</Calculator>',
      '<Calculator show="yes"><Journal value="[]">[]</Journal></Calculator>',
      '<Calculator show="yes"><Journal><Entry/></Journal></Calculator>'
    ];
    for (const declaration of invalidDeclarations) {
      it(`rejects invalid declaration ${declaration} with testlet context`, () => {
        expect(() => parser.parseBookletXml(block(declaration))).toThrowMatching((error: unknown) =>
          error instanceof AppError && error.type === 'xml' && error.description.includes('outer'));
      });
    }

    for (const journal of ['', ' ', 'invalid', '{}', 'null', '[null]', '[[]]', '[1]',
      '[{"asLatex":"x"}]', '[{"asLatex":"x","asImage":null}]', '[{"asLatex":0,"asImage":""}]',
      '[{"asLatex":"valid","asImage":""},null]']) {
      it(`rejects invalid journal ${JSON.stringify(journal)}`, () => {
        expect(() => parser.parseBookletXml(block(
          `<Calculator show="yes"><Journal>${journal}</Journal></Calculator>`
        ))).toThrowMatching((error: unknown) =>
          error instanceof AppError && error.type === 'xml' && error.description.includes('Journal'));
      });
    }

    const misplaced = [
      booklet('<Calculator show="yes"/><Unit id="u1" label="Task"/>'),
      block('<Restrictions><Calculator show="yes"/></Restrictions>'),
      booklet('<Testlet id="outer"><Unit id="u1" label="Task"><Calculator show="yes"/></Unit></Testlet>'),
      block('<Calculator show="yes"/><Restrictions/>'),
      booklet('<Testlet id="outer"><Unit id="u1" label="Task"/><Calculator show="yes"/></Testlet>')
    ];
    for (const xml of misplaced) {
      it('rejects a calculator declaration outside its permitted XML position', () => {
        expect(() => parser.parseBookletXml(xml)).toThrowMatching((error: unknown) =>
          error instanceof AppError && error.type === 'xml');
      });
    }

    it('does not retain configuration between booklets', () => {
      parser.parseBookletXml(block('<Calculator show="yes" mode="SCIENTIFIC"/>'));
      expect(findTestlet(parser.parseBookletXml(block('')).units, 'outer').calculator).toBeUndefined();
    });
  });
}

describe('Group-monitor calculator error result', () => {
  it('returns an XML error for an invalid calculator declaration', () => {
    TestBed.configureTestingModule({
      providers: [BookletService, { provide: MonitorBackendService, useValue: {} }]
    });
    expect(TestBed.inject(BookletService).parseXml(block('<Calculator/>'))).toEqual({ error: 'xml', species: null });
  });
});
