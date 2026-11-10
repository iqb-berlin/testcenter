<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class XMLFileExposed extends XMLFile {
  public function getXmlExposed(): SimpleXMLElement {
    return $this->getXML();
  }

  public function validateConstraint(string $desc, string $query1, string $query2, string $compare): bool {
    return parent::validateConstraint($desc, $query1, $query2, $compare);
  }

  static function customConstraintComparisonFunction(
    string | SimpleXMLElement | null $item1,
    string | SimpleXMLElement | null $item2,
    array $results1,
    array $results2,
    SimpleXMLElement $doc
  ) {
    return substr($item1, 0, 1) === substr($item2, 0, 1);
  }
}

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class XMLFileTest extends TestCase {

  public static function setUpBeforeClass(): void {
    require_once "test/unit/VfsForTest.class.php";
    VfsForTest::setUpBeforeClass();
  }

  public function setUp(): void {
    SystemConfig::$xmlSchema_validation = true;
    require_once "test/unit/mock-classes/ExternalFileMock.php";
    VfsForTest::setUp(true);
  }

  private function getErrorString(File $file): string {
    return implode(', ', $file->getValidationReport()['error'] ?? []);
  }

  function test_loadFromFile() {
    $xf = VfsForTest::loadAndValidateFile('ws_1/Booklet/SAMPLE_BOOKLET.XML', 'xml');

    static::assertEquals('SAMPLE_BOOKLET.XML', $xf->getName());
    static::assertEquals('BOOKLET.SAMPLE-1', $xf->getId());
    static::assertEquals('ws_1/Booklet/SAMPLE_BOOKLET.XML', (string) $xf->getPath());
    static::assertEquals('Sample booklet', $xf->getLabel());
    static::assertEquals(filesize(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML'), $xf->getSize());
    static::assertEquals('Booklet', $xf->getRootTagName());
    static::assertEquals('This a sample booklet for testing/development/showcase purposes.', $xf->getDescription());
    static::assertArrayNotHasKey('error', $xf->getValidationReport());
  }


  function test_loadFromArbitrary() {
    file_put_contents(DATA_DIR . "/ws_1/arbitrary.xml", '<a><Metadata><Id>ARBITRARY.XML</Id></Metadata><b>c</b>d</a>');

    $xf = VfsForTest::loadAndValidateFile('ws_1/arbitrary.xml', 'xml');

    static::assertEquals('arbitrary.xml', $xf->getName());
    static::assertEquals('ARBITRARY.XML', $xf->getId());
    static::assertEquals('ws_1/arbitrary.xml', (string) $xf->getPath());
    static::assertEquals('', $xf->getLabel());
    static::assertEquals(59, $xf->getSize());
    static::assertEquals('a', $xf->getRootTagName());
    static::assertEquals('', $xf->getDescription());
  }

  function test_loadFromBogus() {
    $xf = VfsForTest::loadAndValidateFile('ws_1/Testtakers/testtakers-broken.xml', 'xml');

    static::assertEquals('testtakers-broken.xml', $xf->getName());
    static::assertEquals('TESTTAKERS-BROKEN.XML', $xf->getId());
    static::assertEquals('ws_1/Testtakers/testtakers-broken.xml', (string) $xf->getPath());
    static::assertEquals('', $xf->getLabel());
    static::assertEquals(filesize(DATA_DIR . '/ws_1/Testtakers/testtakers-broken.xml'), $xf->getSize());
    static::assertEquals('', $xf->getRootTagName());
    static::assertEquals('', $xf->getDescription());
    static::assertEquals('Error [76] in line 7: Opening and ending tag mismatch: Testtakers line 2 and Metadata, Error [5] in line 9: Extra content at the end of the document', $this->getErrorString($xf));
  }

  function test_loadFromValid() {
    $xf = VfsForTest::loadAndValidateFile('ws_1/Booklet/SAMPLE_BOOKLET.XML', 'xml');

    static::assertEquals('SAMPLE_BOOKLET.XML', $xf->getName());
    static::assertEquals('BOOKLET.SAMPLE-1', $xf->getId());
    static::assertEquals('ws_1/Booklet/SAMPLE_BOOKLET.XML', (string) $xf->getPath());
    static::assertEquals('Sample booklet', $xf->getLabel());
    static::assertEquals(filesize(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML'), $xf->getSize());
    static::assertEquals('Booklet', $xf->getRootTagName());
    static::assertEquals('This a sample booklet for testing/development/showcase purposes.', $xf->getDescription());
    static::assertArrayNotHasKey('error', $xf->getValidationReport());
  }

  function test_loadFromBogusAndValidate() {
    $xf = VfsForTest::loadAndValidateFile('ws_1/Testtakers/testtakers-broken.xml', 'xml');

    static::assertEquals('testtakers-broken.xml', $xf->getName());
    static::assertEquals('TESTTAKERS-BROKEN.XML', $xf->getId());
    static::assertEquals('ws_1/Testtakers/testtakers-broken.xml', (string) $xf->getPath());
    static::assertEquals('', $xf->getLabel());
    static::assertEquals(filesize(DATA_DIR . '/ws_1/Testtakers/testtakers-broken.xml'), $xf->getSize());
    static::assertEquals('', $xf->getRootTagName());
    static::assertEquals('', $xf->getDescription());
    static::assertEquals('Error [76] in line 7: Opening and ending tag mismatch: Testtakers line 2 and Metadata, Error [5] in line 9: Extra content at the end of the document', $this->getErrorString($xf));
  }

  function test_loadFromInvalid() {
    file_put_contents(
      DATA_DIR . "/ws_1/invalid.xml",
      '<Booklet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
      . ' xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-booklet-xml/18.0">'
      . '<Metadata><Id>c</Id><Label>d</Label></Metadata>'
      . '<Invalid></Invalid>'
      . '</Booklet>'
    );
    $xf = VfsForTest::loadAndValidateFile('ws_1/invalid.xml', 'xml');

    static::assertEquals('invalid.xml', $xf->getName());
    static::assertEquals('C', $xf->getId());
    static::assertEquals('ws_1/invalid.xml', (string) $xf->getPath());
    static::assertEquals('d', $xf->getLabel());
    static::assertEquals(225, $xf->getSize());
    static::assertEquals('Booklet', $xf->getRootTagName());
    static::assertEquals('', $xf->getDescription());
    static::assertEquals("Error [1871] in line 2: Element 'Invalid': This element is not expected. Expected is one of ( CustomTexts, BookletConfig, States, Widgets, Units ).", $this->getErrorString($xf));
  }

  function test_fromDataParsesWithoutValidating() {
    $content = '<Booklet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
      . ' xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-booklet-xml/18.0">'
      . '<Metadata><Id>c</Id><Label>d</Label></Metadata>'
      . '<Invalid></Invalid>'
      . '<Units><Unit id="u1" /></Units>'
      . '</Booklet>';

    $file = File::fromData(new FileData(StoragePath::fromString('ws_1/invalid.xml'), 'Booklet', 'C'), $content);

    static::assertInstanceOf(XMLFileBooklet::class, $file);
    static::assertEquals(['U1'], $file->getUnitIds());
    static::assertEquals($content, $file->getContent());
    static::assertArrayNotHasKey('error', $file->getValidationReport());
  }

  function test_withoutContent() {
    $file = new XMLFileExposed(new FileData(StoragePath::fromString('ws_1/a.xml'), 'Booklet', 'A'));

    static::assertEquals('a.xml', $file->getName());
    $this->expectExceptionObject(new LogicException('File `a.xml` has no content.'));
    $file->getXmlExposed();
  }

  private function writeBookletWithSchema(string $schemaUrl): string {
    $path = DATA_DIR . "/ws_1/booklet-schema.xml";
    file_put_contents(
      $path,
      '<Booklet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
      . " xsi:noNamespaceSchemaLocation=\"$schemaUrl\">"
      . '<Metadata><Id>c</Id><Label>d</Label></Metadata>'
      . '</Booklet>'
    );
    return 'ws_1/booklet-schema.xml';
  }

  function test_schemaVersionNewerThanSupported() {
    $xf = VfsForTest::loadAndValidateFile($this->writeBookletWithSchema('https://w3id.org/iqb/spec/testcenter-booklet-xml/19.0'), 'xml');

    static::assertEquals(
      'XSD schema version `19.0` of `testcenter-booklet-xml` is not supported. Supported major versions: 18 to 18.',
      $this->getErrorString($xf)
    );
  }

  function test_schemaVersionOlderThanSupported() {
    $xf = VfsForTest::loadAndValidateFile($this->writeBookletWithSchema('https://w3id.org/iqb/spec/testcenter-booklet-xml/17.4'), 'xml');

    static::assertEquals(
      'XSD schema version `17.4` of `testcenter-booklet-xml` is not supported. Supported major versions: 18 to 18.',
      $this->getErrorString($xf)
    );
  }

  function test_schemaVersionUnsupportedWithoutValidation() {
    SystemConfig::$xmlSchema_validation = false;
    $xf = VfsForTest::loadAndValidateFile($this->writeBookletWithSchema('https://w3id.org/iqb/spec/testcenter-booklet-xml/19.0'), 'xml');

    static::assertEquals(
      'XSD schema version `19.0` of `testcenter-booklet-xml` is not supported. Supported major versions: 18 to 18.',
      $this->getErrorString($xf)
    );
  }

  function test_schemaMissingWithoutValidation() {
    SystemConfig::$xmlSchema_validation = false;
    file_put_contents(DATA_DIR . "/ws_1/no-schema.xml", '<Booklet><Metadata><Id>c</Id><Label>d</Label></Metadata></Booklet>');
    $xf = VfsForTest::loadAndValidateFile('ws_1/no-schema.xml', 'xml');

    static::assertEquals(
      'File has no link to XSD-schema. Expected a schema URL like '
      . '`https://w3id.org/iqb/spec/testcenter-booklet-xml/<version>` with major version 18 to 18.',
      $this->getErrorString($xf)
    );
  }

  function test_schemaLegacyUrl() {
    $xf = VfsForTest::loadAndValidateFile($this->writeBookletWithSchema(
      'https://raw.githubusercontent.com/iqb-berlin/testcenter/17.4.1/definitions/vo_Booklet.xsd'
    ), 'xml');

    static::assertEquals(
      'XSD schema URL could not be resolved. Expected a schema URL like '
      . '`https://w3id.org/iqb/spec/testcenter-booklet-xml/<version>` with major version 18 to 18.',
      $this->getErrorString($xf)
    );
  }

  function test_schemaInvalidContentIgnoredWithoutValidation() {
    SystemConfig::$xmlSchema_validation = false;
    file_put_contents(
      DATA_DIR . "/ws_1/invalid.xml",
      '<Booklet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
      . ' xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-booklet-xml/18.0">'
      . '<Metadata><Id>c</Id><Label>d</Label></Metadata>'
      . '<Invalid></Invalid>'
      . '</Booklet>'
    );
    $xf = VfsForTest::loadAndValidateFile('ws_1/invalid.xml', 'xml');

    static::assertArrayNotHasKey('error', $xf->getValidationReport());
  }

  function test_validateConstraint() {
    $xml = '<root>
      <A min="6" max="3" />
      <A min="7" max="2" />
      <A min="1" />
      <box>
        <B somestr="hello" />
        <C somestr="hello" />
      </box>
      <D somestr="hallo" />
    </root>';
    $this->testValidateConstraint($xml, 'compare numerical attributes with <=', '//A/@min', '//@max','<=',  false);
    $this->testValidateConstraint($xml, 'compare numerical attributes with >=', '//A/@min', '//@max', '>=');
    $this->testValidateConstraint($xml, 'compare strings with !=', '//B/@somestr', '//D/@somestr','!=');
    $this->testValidateConstraint($xml, 'compare strings with ==', '//B/@somestr',  '//D/@somestr', '==', false);
    $this->testValidateConstraint($xml, 'compare identity of nodes (1)', '//B',  '//C','==', false);
    $this->testValidateConstraint($xml, 'compare identity of nodes (2)', '//B',  '//box/B','==');
    $this->testValidateConstraint($xml, 'compare identity of nodes (3)', '//B',  '//C','!=');
    $this->testValidateConstraint($xml, 'use selector which selects nothing', '//NOTHING',  '//box/B','==', false);
    $this->testValidateConstraint($xml, 'custom assertion comparison function', '//*[@somestr]',  '//*[@somestr]','customConstraintComparisonFunction');
  }

  private function testValidateConstraint(string $xml, string $desc, string $q1, string $q2, string $comp, bool $expect = true): void {
    $xf = XMLFileExposed::fromString($xml);
    $result = $xf->validateConstraint($desc, $q1, $q2, $comp);
    static::assertEquals($expect, $result, $desc);
  }
}
