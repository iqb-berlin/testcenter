import { BookletParserService } from './booklet-parser.service';
import { BookletConfig } from '../classes/booklet-config.class';
import {
  BookletDef, BookletMetadata, BookletStateDef, BookletStateOptionDef, TestletDef, UnitDef
} from '../interfaces/booklet.interfaces';

type Testlet = TestletDef<Testlet, UnitDef>;
type BookletState = BookletStateDef<BookletStateOptionDef>;
type Booklet = BookletDef<Testlet, BookletState>;

// keeps what the parser delivers, so the spec sees it directly
class Parser extends BookletParserService<UnitDef, Testlet, BookletStateOptionDef, BookletState, Booklet> {
  toBooklet(
    metadata: BookletMetadata,
    config: BookletConfig,
    customTexts: { [key: string]: string },
    states: { [key: string]: BookletState },
    units: Testlet
  ): Booklet {
    return {
      metadata, config, customTexts, states, units
    };
  }

  toTestlet(testletDef: TestletDef<Testlet, UnitDef>): Testlet {
    return testletDef;
  }

  toUnit(unitDef: UnitDef): UnitDef {
    return unitDef;
  }

  toBookletState(stateDef: BookletState): BookletState {
    return stateDef;
  }

  toBookletStateOption(optionDef: BookletStateOptionDef): BookletStateOptionDef {
    return optionDef;
  }
}

describe('BookletParserService', () => {
  const calculator = { model: 'CALCULATOR', parameters: [{ key: 'JOURNAL_LINES', value: '2' }] };
  const periodicTable = { model: 'PERIODIC_TABLE', parameters: [] };

  function parseUnits(units: string): { [unitId: string]: UnitDef } {
    const booklet = new Parser().parseBookletXml(`
      <Booklet>
        <Metadata><Id>b</Id><Label>B</Label></Metadata>
        <Widgets>
          <Widget id="calc" model="CALCULATOR"><Parameter key="JOURNAL_LINES">2</Parameter></Widget>
          <Widget id="periodic" model="PERIODIC_TABLE" />
        </Widgets>
        ${units}
      </Booklet>`);
    const unitsById: { [unitId: string]: UnitDef } = {};
    const collect = (testlet: Testlet): void => testlet.children.forEach((child) => {
      if ('children' in child) {
        collect(child);
      } else {
        unitsById[child.id] = child;
      }
    });
    collect(booklet.units);
    return unitsById;
  }

  describe('widgets', () => {
    it('offers no widgets by default', () => {
      expect(parseUnits('<Units><Unit id="u1" label="1" /></Units>').u1.widgets).toEqual([]);
    });

    it('offers the widgets of the unit with their parameters', () => {
      expect(parseUnits('<Units><Unit id="u1" label="1" widgets="calc periodic" /></Units>').u1.widgets)
        .toEqual([calculator, periodicTable]);
    });

    it('passes widgets down to all units of a testlet, including nested ones', () => {
      const units = parseUnits(`
        <Units widgets="calc">
          <Unit id="u1" label="1" />
          <Testlet id="t1">
            <Testlet id="t2"><Unit id="u2" label="2" /></Testlet>
          </Testlet>
        </Units>`);
      expect(units.u1.widgets).toEqual([calculator]);
      expect(units.u2.widgets).toEqual([calculator]);
    });

    it('lets the nearest element decide, an empty value offering none', () => {
      const units = parseUnits(`
        <Units widgets="calc">
          <Testlet id="t1" widgets="periodic">
            <Unit id="u1" label="1" />
            <Unit id="u2" label="2" widgets="" />
          </Testlet>
          <Testlet id="t2" widgets="">
            <Unit id="u3" label="3" widgets="calc" />
            <Unit id="u4" label="4" />
          </Testlet>
        </Units>`);
      expect(units.u1.widgets).toEqual([periodicTable]);
      expect(units.u2.widgets).toEqual([]);
      expect(units.u3.widgets).toEqual([calculator]);
      expect(units.u4.widgets).toEqual([]);
    });
  });
});
