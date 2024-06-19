import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { BookletService } from './booklet.service';
import { BackendService } from '../backend.service';

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-unused-vars
  getBooklet(_: string): Observable<string> {
    return of('<booklet>TODO insert nice booklet</booklet>');
  }
}

describe('BookletService', () => {
  let service: BookletService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BookletService,
        {
          provide: BackendService,
          useValue: new MockBackendService()
        }
      ],
      imports: [MatTableModule, MatIconModule]
    });
    service = TestBed.inject(BookletService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  xit('parseBookletXml() should parse a Booklet-Xml to a Booklet-Object', () => {
    // TODO implement unit.test
  });

  xit('parseMetadata() should parse the <metadata>-element', () => {
    // TODO implement unit.test
  });

  xit('parseTestlet() should parse the <testlet>-element', () => {
    // TODO implement unit.test
  });

  xit('parseUnitOrTestlet() should parse the <unit>-element or call parseTestlet()', () => {
    // TODO implement unit.test
  });

  xit('parseRestrictions() should parse the <restrictions>-element', () => {
    // TODO implement unit.test
  });

  describe('XML functions', () => {
    xit('xmlGetChildTextIfExists() should return a child element\'s text ' +
      'of a given name from a domElement if that exists', () => {
      // TODO implement unit.test
    });

    xit('xmlGetChildIfExists() should return a child element of a given name from a domElement if that exists', () => {
      // TODO implement unit.test
    });

    xit('xmlGetDirectChildrenByTagName() should return all children from a domElement with a given name', () => {
      // TODO implement unit.test
    });

    it('xmlCountChildrenOfTagNames() should count all (grand-)children of the defined types', () => {
      const domParser = new DOMParser();
      const testXml = '<root><a>x<b>x</b><b /><b></b></a><b><!-- ! --><c>x</c>x</b><a><b></b></a>x</root>';
      const testContent = domParser.parseFromString(testXml, 'text/xml').documentElement;

      const xmlCountChildrenOfTagNames = service.xmlCountChildrenOfTagNames;

      let result = xmlCountChildrenOfTagNames(testContent, ['a']);
      expect(result).withContext('a').toEqual(2);

      result = xmlCountChildrenOfTagNames(testContent, ['b']);
      expect(result).withContext('b').toEqual(5);

      result = xmlCountChildrenOfTagNames(testContent, ['c']);
      expect(result).withContext('c').toEqual(1);

      result = xmlCountChildrenOfTagNames(testContent, ['d']);
      expect(result).withContext('c').toEqual(0);

      result = xmlCountChildrenOfTagNames(testContent, ['a', 'b', 'c', 'd']);
      expect(result).withContext('c').toEqual(8);
    });
  });
});
