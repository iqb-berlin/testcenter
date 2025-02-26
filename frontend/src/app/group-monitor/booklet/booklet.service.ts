import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { BackendService } from '../backend.service';
import {
  isUnit, Booklet, Testlet, BookletError, Unit, BookletState, BookletStateOption
} from '../group-monitor.interfaces';
import { BookletParserService } from '../../shared/services/booklet-parser.service';
import {
  BookletConfig, BookletMetadata, BookletStateDef, BookletStateOptionDef, ContextInBooklet, TestletDef, UnitDef
} from '../../shared/shared.module';

@Injectable()
export class BookletService extends BookletParserService<Unit, Testlet, BookletStateOption, BookletState, Booklet> {
  private readonly booklets: { [k: string]: Observable<Booklet | BookletError> } = {};

  constructor(
    private bs: BackendService
  ) {
    super();
  }

  getBooklet(bookletName = ''): Observable<Booklet | BookletError> {
    if (typeof this.booklets[bookletName] !== 'undefined') {
      return this.booklets[bookletName];
    }
    if (bookletName === '') {
      this.booklets[bookletName] = of<Booklet | BookletError>({ error: 'missing-id', species: null });
    } else {
      this.booklets[bookletName] = this.bs.getBooklet(bookletName)
        .pipe(
          // eslint-disable-next-line max-len
          map((response: string | BookletError) => (typeof response === 'string' ? this.parseXml(response) : response)),
          shareReplay(1)
        );
    }
    return this.booklets[bookletName];
  }

  parseXml(xmlString: string): Booklet | BookletError {
    try {
      return this.parseBookletXml(xmlString);
    } catch (error) {
      return { error: 'xml', species: null };
    }
  }

  toBooklet(
    metadata: BookletMetadata,
    config: BookletConfig,
    customTexts: { [key: string]: string },
    states: { [key: string]: BookletState },
    units: Testlet
  ): Booklet {
    return {
      metadata,
      config,
      customTexts,
      states,
      units,
      species: this.getBookletSpecies(units)
    };
  }

  override toTestlet(testletDef: TestletDef<Testlet, Unit>, e: Element, context: ContextInBooklet<Testlet>): Testlet {
    return Object.assign(testletDef, {
      descendantCount: this.xmlCountChildrenOfTagNames(e, ['Unit']),
      blockId: `${context.localTestletIndex + 1}`,
      nextBlockId: `${context.localTestletIndex + 2}`
    });
  }

  // eslint-disable-next-line class-methods-use-this
  override toUnit(unitDef: UnitDef): Unit {
    return unitDef;
  }

  // eslint-disable-next-line class-methods-use-this
  override toBookletState(stateDef: BookletStateDef<BookletStateOption>): BookletState {
    const defaultOption = Object.values(stateDef.options).find(option => !option.conditions.length);
    return Object.assign(stateDef, {
      default: defaultOption?.id || Object.values(stateDef.options)[0].id
    });
  }

  // eslint-disable-next-line class-methods-use-this
  override toBookletStateOption(optionDef: BookletStateOptionDef): BookletStateOption {
    return optionDef;
  }

  // eslint-disable-next-line class-methods-use-this
  getBookletSpecies(units: Testlet): string {
    return `species: ${units.children.filter(testletOrUnit => !isUnit(testletOrUnit)).length}`;
  }
}
