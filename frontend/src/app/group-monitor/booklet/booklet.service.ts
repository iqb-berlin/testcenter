import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { BackendService } from '../backend.service';
import {
  isUnit, Booklet, Testlet, BookletError, Unit, BookletState, BookletStateOption
} from '../group-monitor.interfaces';
import { BookletParserService } from '../../shared/services/booklet-parser.service';
import {
  BookletDef, BookletStateDef, BookletStateOptionDef, ContextInBooklet, TestletDef, UnitDef
} from '../../shared/shared.module';

@Injectable()
export class BookletService extends BookletParserService<Unit, Testlet, BookletStateOption, BookletState, Booklet> {
  booklets: { [k: string]: Observable<Booklet | BookletError> } = {};

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

  toBooklet(bookletDef: BookletDef<Testlet, BookletStateDef<BookletStateOptionDef>>): Booklet {
    return Object.assign(bookletDef, {
      species: this.getBookletSpecies(bookletDef)
    });
  }

  override toTestlet(testletDef: TestletDef<Testlet, Unit>, e: Element, context: ContextInBooklet<Testlet>): Testlet {
    return Object.assign(testletDef, {
      descendantCount: this.xmlCountChildrenOfTagNames(e, ['Unit']),
      blockId: `block ${context.localTestletIndex + 1}`,
      nextBlockId: `block ${context.localTestletIndex + 2}`
    });
  }

  // eslint-disable-next-line class-methods-use-this
  override toUnit(unitDef: UnitDef): Unit {
    return unitDef;
  }

  // eslint-disable-next-line class-methods-use-this
  override toBookletState(stateDef: BookletStateDef<BookletStateOption>, unitElement: Element): BookletState {
    return stateDef;
  }

  // eslint-disable-next-line class-methods-use-this
  override toBookletStateOption(optionDef: BookletStateOptionDef, unitElement: Element): BookletStateOption {
    return optionDef;
  }

  // eslint-disable-next-line class-methods-use-this
  getBookletSpecies(booklet: BookletDef<Testlet, BookletStateDef<BookletStateOptionDef>>): string {
    return `species: ${booklet.units.children.filter(testletOrUnit => !isUnit(testletOrUnit)).length}`;
  }
}
