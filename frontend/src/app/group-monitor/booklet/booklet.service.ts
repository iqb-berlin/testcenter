import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { BackendService } from '../backend.service';
import {
  Booklet, BookletError, BookletMetadata, isTestlet, isUnit, Restrictions, Testlet, Unit
} from '../group-monitor.interfaces';
import { BookletConfig } from '../../shared/classes/booklet-config.class';

@Injectable()
export class BookletService {
  booklets: { [k: string]: Observable<Booklet | BookletError> } = {};

  constructor(
    private bs: BackendService
  ) { }

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
          map((response: string | BookletError) => (typeof response === 'string' ? BookletService.parseBookletXml(response) : response)),
          shareReplay(1)
        );
    }
    return this.booklets[bookletName];
  }

  private static parseBookletXml(xmlString: string): Booklet | BookletError {
    try {
      const domParser = new DOMParser();
      const xmlStringWithOutBom = xmlString.replace(/^\uFEFF/gm, '');
      const bookletElement = domParser.parseFromString(xmlStringWithOutBom, 'text/xml').documentElement;

      if (bookletElement.nodeName !== 'Booklet') {
        // console.warn('XML-root is not `Booklet`');
        return { error: 'xml', species: null };
      }

      const units = BookletService.xmlGetChildIfExists(bookletElement, 'Units');
      if (units == null) {
        return { error: 'xml', species: null };
      }

      const metadata = BookletService.parseMetadata(bookletElement);
      if (metadata == null) {
        return { error: 'xml', species: null };
      }

      const parsedBooklet: Booklet = {
        units: BookletService.parseTestlet(units),
        metadata: metadata,
        config: BookletService.parseBookletConfig(bookletElement),
        species: ''
      };
      BookletService.addBookletStructureInformation(parsedBooklet);
      return parsedBooklet;
    } catch (error) {
      // console.warn('Error reading booklet XML:', error);
      return { error: 'xml', species: null };
    }
  }

  private static addBookletStructureInformation(booklet: Booklet): void {
    booklet.species = BookletService.getBookletSpecies(booklet);
    booklet.units.children
      .filter(isTestlet)
      .forEach((block: Testlet, index, blocks) => {
        block.blockId = `block ${index + 1}`;
        if (index < blocks.length - 1) {
          block.nextBlockId = `block ${index + 2}`;
        }
      });
  }

  private static getBookletSpecies(booklet: Booklet): string {
    return `species: ${booklet.units.children.filter(testletOrUnit => !isUnit(testletOrUnit)).length}`;
  }

  private static parseBookletConfig(bookletElement: Element): BookletConfig {
    const bookletConfigElements = BookletService.xmlGetChildIfExists(bookletElement, 'BookletConfig', true);
    const bookletConfig = new BookletConfig();
    if (bookletConfigElements) {
      bookletConfig.setFromXml(bookletConfigElements);
    }
    return bookletConfig;
  }

  private static parseMetadata(bookletElement: Element): BookletMetadata | null {
    const metadataElement = BookletService.xmlGetChildIfExists(bookletElement, 'Metadata');
    if (!metadataElement) {
      return null;
    }
    return {
      id: BookletService.xmlGetChildTextIfExists(metadataElement, 'Id'),
      label: BookletService.xmlGetChildTextIfExists(metadataElement, 'Label'),
      description: BookletService.xmlGetChildTextIfExists(metadataElement, 'Description', true)
    };
  }

  private static parseTestlet(testletElement: Element): Testlet {
    return {
      id: testletElement.getAttribute('id') || '',
      label: testletElement.getAttribute('label') || '',
      restrictions: BookletService.parseRestrictions(testletElement),
      children: BookletService.xmlGetDirectChildrenByTagName(testletElement, ['Unit', 'Testlet'])
        .map(BookletService.parseUnitOrTestlet),
      descendantCount: BookletService.xmlCountChildrenOfTagNames(testletElement, ['Unit'])
    };
  }

  private static parseUnitOrTestlet(unitOrTestletElement: Element): (Unit | Testlet) {
    if (unitOrTestletElement.tagName === 'Unit') {
      return {
        id: unitOrTestletElement.getAttribute('alias') || unitOrTestletElement.getAttribute('id') || '',
        label: unitOrTestletElement.getAttribute('label') || '',
        labelShort: unitOrTestletElement.getAttribute('labelshort') || ''
      };
    }
    return BookletService.parseTestlet(unitOrTestletElement);
  }

  private static parseRestrictions(testletElement: Element): Restrictions {
    const restrictions: Restrictions = {};
    const restrictionsElement = BookletService.xmlGetChildIfExists(testletElement, 'Restrictions', true);
    if (!restrictionsElement) {
      return restrictions;
    }
    const codeToEnterElement = restrictionsElement.querySelector('CodeToEnter');
    if (codeToEnterElement) {
      restrictions.codeToEnter = {
        code: codeToEnterElement.getAttribute('code') || '',
        message: codeToEnterElement.textContent || ''
      };
    }
    const timeMaxElement = restrictionsElement.querySelector('TimeMax');
    if (timeMaxElement) {
      restrictions.timeMax = {
        minutes: parseFloat(timeMaxElement.getAttribute('minutes') || '')
      };
    }
    return restrictions;
  }

  private static xmlGetChildIfExists(element: Element, childName: string, isOptional = false): Element | null {
    const elements = BookletService.xmlGetDirectChildrenByTagName(element, [childName]);
    if (!elements.length && !isOptional) {
      throw new Error(`Missing field: '${childName}'`);
    }
    return elements.length ? elements[0] : null;
  }

  private static xmlGetChildTextIfExists(element: Element, childName: string, isOptional = false): string {
    const childElement = BookletService.xmlGetChildIfExists(element, childName, isOptional);
    return (childElement && childElement.textContent) ? childElement.textContent : '';
  }

  private static xmlGetDirectChildrenByTagName(element: Element, tagNames: string[]): Element[] {
    return [].slice.call(element.childNodes)
      .filter((elem: Element) => (elem.nodeType === 1))
      .filter((elem: Element) => (tagNames.indexOf(elem.tagName) > -1));
  }

  private static xmlCountChildrenOfTagNames(element: Element, tagNames: string[]): number {
    return element.querySelectorAll(tagNames.join(', ')).length;
  }
}
