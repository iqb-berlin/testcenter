import { BookletConfig } from '../classes/booklet-config.class';
import {
  BookletDef, BookletMetadata, ContextInBooklet, Restrictions, TestletDef, UnitDef
} from '../interfaces/booklet.interfaces';
import { AppError } from '../../app.interfaces';

export abstract class BookletParserService<
  Unit extends UnitDef,
  Testlet extends TestletDef<Testlet, Unit>,
  Booklet extends BookletDef<Testlet>
> {
  abstract toBooklet(
    bookletDef: BookletDef<Testlet>,
    bookletElement: Element
  ): Booklet;

  abstract toTestlet(
    testletDef: TestletDef<Testlet, Unit>,
    testletElement: Element,
    context: ContextInBooklet<Testlet>
  ): Testlet;

  abstract toUnit(
    unitDef: UnitDef,
    unitElement: Element,
    context: ContextInBooklet<Testlet>
  ): Unit;

  parseBookletXml(xmlString: string): Booklet {
    const domParser = new DOMParser();
    const xmlStringWithOutBom = xmlString.replace(/^\uFEFF/gm, '');
    const bookletElement = domParser.parseFromString(xmlStringWithOutBom, 'text/xml').documentElement;

    if (bookletElement.nodeName !== 'Booklet') {
      throw new AppError({ label: 'Invalid XML', description: 'wrong root-tag', type: 'xml' });
    }

    const units = this.xmlGetChildIfExists(bookletElement, 'Units');
    if (units == null) {
      throw new AppError({ label: 'Invalid XML', description: 'no <units>', type: 'xml' });
    }

    const metadata = this.parseMetadata(bookletElement);
    if (metadata == null) {
      throw new AppError({ label: 'Invalid XML', description: 'invalid metadata', type: 'xml' });
    }

    const rootContext: ContextInBooklet<Testlet> = {
      globalIndex: 0,
      localIndex: 0,
      localIndexOfTestlets: 0,
      parent: null
    };
    return this.toBooklet(
      {
        units: this.parseTestlet(units, rootContext),
        metadata: metadata,
        config: this.parseBookletConfig(bookletElement),
        customTexts: this.xmlGetCustomTexts(bookletElement)
      },
      bookletElement
    );
  }

  parseBookletConfig(bookletElement: Element): BookletConfig {
    const bookletConfigElements = this.xmlGetChildIfExists(bookletElement, 'BookletConfig', true);
    const bookletConfig = new BookletConfig();
    if (bookletConfigElements) {
      bookletConfig.setFromXml(bookletConfigElements);
    }
    return bookletConfig;
  }

  parseMetadata(bookletElement: Element): BookletMetadata | null {
    const metadataElement = this.xmlGetChildIfExists(bookletElement, 'Metadata');
    if (!metadataElement) {
      return null;
    }
    return {
      id: this.xmlGetChildTextIfExists(metadataElement, 'Id'),
      label: this.xmlGetChildTextIfExists(metadataElement, 'Label'),
      description: this.xmlGetChildTextIfExists(metadataElement, 'Description', true)
    };
  }

  private parseTestlet(testletElement: Element, context: ContextInBooklet<Testlet>): Testlet {
    let testletChildrenCount = 0;
    const pointerContainer: { self: Testlet | null } = { self: null };
    const testlet = this.toTestlet(
      {
        id: testletElement.getAttribute('id') || '',
        label: testletElement.getAttribute('label') || '',
        restrictions: this.parseRestrictions(testletElement),
        children: this.xmlGetDirectChildrenByTagName(testletElement, ['Unit', 'Testlet'])
          .map((item, index) => this.parseUnitOrTestlet(item, {
            localIndex: index,
            globalIndex: context.localIndex + index,
            // eslint-disable-next-line no-plusplus
            localIndexOfTestlets: (item.tagName === 'Testlet') ? testletChildrenCount++ : NaN,
            parent: pointerContainer.self
          }))
      },
      testletElement,
      context
    );
    pointerContainer.self = testlet;
    return testlet;
  }

  parseUnitOrTestlet(element: Element, context: ContextInBooklet<Testlet>): (Unit | Testlet) {
    if (element.tagName === 'Unit') {
      return this.toUnit(
        {
          id: element.getAttribute('alias') || element.getAttribute('id') || '',
          label: element.getAttribute('label') || '',
          labelShort: element.getAttribute('labelshort') || ''
        },
        element,
        context
      );
    }
    return this.parseTestlet(element, context);
  }

  parseRestrictions(testletElement: Element): Restrictions {
    const restrictions: Restrictions = {};
    const restrictionsElement = this.xmlGetChildIfExists(testletElement, 'Restrictions', true);
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

  xmlGetChildIfExists(element: Element, childName: string, isOptional = false): Element | null {
    const elements = this.xmlGetDirectChildrenByTagName(element, [childName]);
    if (!elements.length && !isOptional) {
      throw new Error(`Missing field: '${childName}'`);
    }
    return elements.length ? elements[0] : null;
  }

  xmlGetChildTextIfExists(element: Element, childName: string, isOptional = false): string {
    const childElement = this.xmlGetChildIfExists(element, childName, isOptional);
    return (childElement && childElement.textContent) ? childElement.textContent : '';
  }

  // eslint-disable-next-line class-methods-use-this
  xmlGetDirectChildrenByTagName(element: Element, tagNames: string[]): Element[] {
    return [].slice.call(element.childNodes)
      .filter((elem: Element) => (elem.nodeType === 1))
      .filter((elem: Element) => (tagNames.indexOf(elem.tagName) > -1));
  }

  // eslint-disable-next-line class-methods-use-this
  xmlCountChildrenOfTagNames(element: Element, tagNames: string[]): number {
    return element.querySelectorAll(tagNames.join(', ')).length;
  }

  // eslint-disable-next-line class-methods-use-this
  xmlGetCustomTexts(element: Element): { [key: string]: string } {
    // TODO X
    return {};
  }
}
