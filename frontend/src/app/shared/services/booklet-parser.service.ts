import { BookletConfig } from '../classes/booklet-config.class';
import {
  BlockCondition, BlockConditionExpression, BlockConditionSourceAggregation,
  BlockConditionSourceAggregationTypes,
  BlockConditionExpressionTypes,
  BlockConditionSource,
  BlockConditionSourceTypes,
  BookletDef,
  BookletMetadata,
  ContextInBooklet,
  Restrictions,
  TestletDef,
  UnitDef, BlockConditionAggregation, BlockConditionAggregationTypes
} from '../interfaces/booklet.interfaces';
import { AppError } from '../../app.interfaces';
import { isNavigationLeaveRestrictionValue } from '../../test-controller/interfaces/test-controller.interfaces';

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

    const unitsElement = this.xmlGetChildIfExists(bookletElement, 'Units');
    if (unitsElement == null) {
      throw new AppError({ label: 'Invalid XML', description: 'no <units>', type: 'xml' });
    }

    const metadata = this.parseMetadata(bookletElement);
    if (metadata == null) {
      throw new AppError({ label: 'Invalid XML', description: 'invalid metadata', type: 'xml' });
    }

    const config = this.parseBookletConfig(bookletElement);
    const customTexts = this.parseCustomTexts(bookletElement);

    const globalContext = {
      unitIndex: 0,
      config
    };
    const rootContext: ContextInBooklet<Testlet> = {
      localUnitIndex: 0,
      localTestletIndex: 0,
      parents: [],
      global: globalContext
    };

    const units = this.parseTestlet(unitsElement, rootContext);

    return this.toBooklet(
      {
        units, metadata, config, customTexts
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
    let testletCount = 0;
    let unitCount = 0;
    const testlet = this.toTestlet(
      {
        id: testletElement.getAttribute('id') || '',
        label: testletElement.getAttribute('label') || '',
        restrictions: this.parseRestrictions(testletElement, context),
        children: []
      },
      testletElement,
      context
    );
    this.xmlGetDirectChildrenByTagName(testletElement, ['Unit', 'Testlet'])
      .forEach(item => {
        testlet.children.push(
          this.parseUnitOrTestlet(item, {
            // eslint-disable-next-line no-plusplus
            localTestletIndex: (item.tagName === 'Testlet') ? testletCount++ : testletCount,
            global: context.global,
            parents: [testlet, ...context.parents],
            // eslint-disable-next-line no-plusplus
            localUnitIndex: (item.tagName === 'Unit') ? unitCount++ : unitCount
          })
        );
      });
    return testlet;
  }

  parseUnitOrTestlet(element: Element, context: ContextInBooklet<Testlet>): (Unit | Testlet) {
    // console.log(element.getAttribute('id') || '', ' : ', context.parents.map(o => o.id).join(' < '));
    if (element.tagName === 'Unit') {
      context.global.unitIndex += 1;
      return this.toUnit(
        {
          id: element.getAttribute('id') || '',
          alias: element.getAttribute('alias') || element.getAttribute('id') || '',
          label: element.getAttribute('label') || '',
          labelShort: element.getAttribute('labelshort') || ''
        },
        element,
        context
      );
    }
    return this.parseTestlet(element, context);
  }

  parseRestrictions(testletElement: Element, context: ContextInBooklet<Testlet>): Restrictions {
    let codeToEnter;
    let timeMax;
    let denyNavigationOnIncomplete;
    let conditions: BlockCondition[] = [];

    const restrictionsElement = this.xmlGetChildIfExists(testletElement, 'Restrictions', true);
    if (!restrictionsElement) {
      return { if: conditions };
    }
    const codeToEnterElement = restrictionsElement.querySelector('CodeToEnter');
    if (codeToEnterElement) {
      codeToEnter = {
        code: codeToEnterElement.getAttribute('code') || '',
        message: codeToEnterElement.textContent || ''
      };
    }
    const timeMaxElement = restrictionsElement.querySelector('TimeMax');
    if (timeMaxElement) {
      timeMax = {
        minutes: parseFloat(timeMaxElement.getAttribute('minutes') || '')
      };
    }

    const ifElements = this.xmlGetDirectChildrenByTagName(restrictionsElement, ['If']);
    conditions = ifElements.flatMap(ifElem => this.parseIf(ifElem));

    // TODO X inkonsequent:
    // a) hier wird die erb-eigenschaft schon im generischen parser umgesetzt, beim timeMax und codeToEnter
    // erst in der ausprägung
    // b) hier wird die eigeschaft geertb, bei den anderen beiden das testlet.

    const denyNavigationOnIncompleteElement = restrictionsElement.querySelector('DenyNavigationOnIncomplete');
    const presentationValue = denyNavigationOnIncompleteElement?.getAttribute('presentation') || '';
    const presentation = isNavigationLeaveRestrictionValue(presentationValue) ?
      presentationValue :
      context.parents.reduceRight(
        (previous, testlet) => testlet.restrictions.denyNavigationOnIncomplete?.presentation || previous,
        context.global.config.force_presentation_complete
      );
    const responseValue = denyNavigationOnIncompleteElement?.getAttribute('response') || '';
    const response = isNavigationLeaveRestrictionValue(responseValue) ?
      responseValue :
      context.parents.reduceRight(
        (previous, testlet) => testlet.restrictions.denyNavigationOnIncomplete?.response || previous,
        context.global.config.force_response_complete
      );

    // eslint-disable-next-line prefer-const
    denyNavigationOnIncomplete = { presentation, response };

    return {
      codeToEnter,
      timeMax,
      denyNavigationOnIncomplete,
      if: conditions
    };
  }

  parseIf(ifElement: Element): BlockCondition[] {
    const conditionSourceElements = this.xmlGetDirectChildrenByTagName(
      ifElement,
      [
        ...BlockConditionSourceAggregationTypes,
        ...BlockConditionSourceTypes,
        ...BlockConditionAggregationTypes
      ]
    );
    const conditionSourceElement = conditionSourceElements.pop();
    const conditionExpressionElement = this.xmlGetChildIfExists(ifElement, 'Is');
    if (!conditionSourceElement || !conditionExpressionElement) {
      return [];
    }

    const parseSourceElement = (expressionElement: Element): BlockConditionSource => ({
      type: expressionElement.tagName,
      variable: expressionElement.getAttribute('of') || '',
      unitAlias: expressionElement.getAttribute('from') || ''
    });

    let source: BlockConditionSource | BlockConditionSourceAggregation | BlockConditionAggregation;
    if (BlockConditionSourceTypes.includes(conditionSourceElement.tagName)) {
      source = parseSourceElement(conditionSourceElement);
    } else if (BlockConditionSourceAggregationTypes.includes(conditionSourceElement.tagName)) {
      source = <BlockConditionSourceAggregation>{
        type: conditionSourceElement.tagName,
        sources: this.xmlGetDirectChildrenByTagName(conditionSourceElement, BlockConditionSourceTypes)
          .map(parseSourceElement)
      };
    } else if (BlockConditionAggregationTypes.includes(conditionSourceElement.tagName)) {
      source = <BlockConditionAggregation>{
        type: conditionSourceElement.tagName,
        conditions: this.xmlGetDirectChildrenByTagName(conditionSourceElement, ['If'])
          .flatMap(this.parseIf.bind(this))
      };
    } else {
      return [];
    }

    return BlockConditionExpressionTypes
      .map((compType): BlockCondition | null => {
        const compAtt = conditionExpressionElement.getAttribute(compType);
        return (compAtt == null) ? null : {
          source,
          expression: {
            type: compType,
            value: compAtt
          }
        };
      })
      .filter((condition): condition is BlockCondition => condition != null);
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
  parseCustomTexts(bookletElement: Element): { [key: string]: string } {
    const customTexts : { [key: string]: string } = {};
    const customTextElement = this.xmlGetChildIfExists(bookletElement, 'CustomTexts');
    if (!customTextElement) {
      return customTexts;
    }
    this.xmlGetDirectChildrenByTagName(customTextElement, ['CustomText'])
      .forEach(elem => {
        const key = elem.getAttribute('key');
        if (key) {
          customTexts[key] = elem.textContent || '';
        }
      });
    return customTexts;
  }
}
