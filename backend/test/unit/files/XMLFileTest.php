<?php

use PHPUnit\Framework\TestCase;

class XMLFileExposed extends XMLFile {
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
    $xf = new XMLFile(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML');

    $this->assertEquals('SAMPLE_BOOKLET.XML', $xf->getName());
    $this->assertEquals('BOOKLET.SAMPLE-1', $xf->getId());
    $this->assertEquals('vfs://root/data/ws_1/Booklet/SAMPLE_BOOKLET.XML', $xf->getPath());
    $this->assertEquals('Sample booklet', $xf->getLabel());
    $this->assertEquals(filesize(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML'), $xf->getSize());
    $this->assertEquals('Booklet', $xf->getRootTagName());
    $this->assertEquals('This a sample booklet for testing/development/showcase purposes.', $xf->getDescription());
    $this->assertArrayNotHasKey('error', $xf->getValidationReport());
  }

  function test_loadFromNotExisting() {
    $xf = new XMLFile(DATA_DIR . '/ws_1/Booklet/not-existing.XML');

    $this->assertEquals('not-existing.XML', $xf->getName());
    $this->assertEquals('NOT-EXISTING.XML', $xf->getId());
    $this->assertEquals('vfs://root/data/ws_1/Booklet/not-existing.XML', $xf->getPath());
    $this->assertEquals('', $xf->getLabel());
    $this->assertEquals(0, $xf->getSize());
    $this->assertEquals('', $xf->getRootTagName());
    $this->assertEquals('', $xf->getDescription());
    $this->assertEquals('File does not exist: `vfs://root/data/ws_1/Booklet/not-existing.XML`', $this->getErrorString($xf));
  }

  function test_loadFromArbitrary() {
    file_put_contents(DATA_DIR . "/ws_1/arbitrary.xml", '<a><Metadata><Id>ARBITRARY.XML</Id></Metadata><b>c</b>d</a>');

    $xf = new XMLFile(DATA_DIR . '/ws_1/arbitrary.xml');

    $this->assertEquals('arbitrary.xml', $xf->getName());
    $this->assertEquals('ARBITRARY.XML', $xf->getId());
    $this->assertEquals('vfs://root/data/ws_1/arbitrary.xml', $xf->getPath());
    $this->assertEquals('', $xf->getLabel());
    $this->assertEquals(59, $xf->getSize());
    $this->assertEquals('a', $xf->getRootTagName());
    $this->assertEquals('', $xf->getDescription());
  }

  function test_loadFromBogus() {
    $xf = new XMLFile(DATA_DIR . '/ws_1/Testtakers/testtakers-broken.xml');

    $this->assertEquals('testtakers-broken.xml', $xf->getName());
    $this->assertEquals('TESTTAKERS-BROKEN.XML', $xf->getId());
    $this->assertEquals('vfs://root/data/ws_1/Testtakers/testtakers-broken.xml', $xf->getPath());
    $this->assertEquals('', $xf->getLabel());
    $this->assertEquals(filesize(DATA_DIR . '/ws_1/Testtakers/testtakers-broken.xml'), $xf->getSize());
    $this->assertEquals('', $xf->getRootTagName());
    $this->assertEquals('', $xf->getDescription());
    $this->assertEquals('Error [76] in line 7: Opening and ending tag mismatch: Testtakers line 2 and Metadata, Error [5] in line 9: Extra content at the end of the document', $this->getErrorString($xf));
  }

  function test_loadFromValid() {
    $xf = new XMLFile(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML');

    $this->assertEquals('SAMPLE_BOOKLET.XML', $xf->getName());
    $this->assertEquals('BOOKLET.SAMPLE-1', $xf->getId());
    $this->assertEquals('vfs://root/data/ws_1/Booklet/SAMPLE_BOOKLET.XML', $xf->getPath());
    $this->assertEquals('Sample booklet', $xf->getLabel());
    $this->assertEquals(filesize(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML'), $xf->getSize());
    $this->assertEquals('Booklet', $xf->getRootTagName());
    $this->assertEquals('This a sample booklet for testing/development/showcase purposes.', $xf->getDescription());
    $this->assertArrayNotHasKey('error', $xf->getValidationReport());
  }

  function test_loadFromBogusAndValidate() {
    $xf = new XMLFile(DATA_DIR . '/ws_1/Testtakers/testtakers-broken.xml');

    $this->assertEquals('testtakers-broken.xml', $xf->getName());
    $this->assertEquals('TESTTAKERS-BROKEN.XML', $xf->getId());
    $this->assertEquals('vfs://root/data/ws_1/Testtakers/testtakers-broken.xml', $xf->getPath());
    $this->assertEquals('', $xf->getLabel());
    $this->assertEquals(filesize(DATA_DIR . '/ws_1/Testtakers/testtakers-broken.xml'), $xf->getSize());
    $this->assertEquals('', $xf->getRootTagName());
    $this->assertEquals('', $xf->getDescription());
    $this->assertEquals('Error [76] in line 7: Opening and ending tag mismatch: Testtakers line 2 and Metadata, Error [5] in line 9: Extra content at the end of the document', $this->getErrorString($xf));
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
    $xf = new XMLFile(DATA_DIR . '/ws_1/invalid.xml');

    $this->assertEquals('invalid.xml', $xf->getName());
    $this->assertEquals('C', $xf->getId());
    $this->assertEquals('vfs://root/data/ws_1/invalid.xml', $xf->getPath());
    $this->assertEquals('d', $xf->getLabel());
    $this->assertEquals(225, $xf->getSize());
    $this->assertEquals('Booklet', $xf->getRootTagName());
    $this->assertEquals('', $xf->getDescription());
    $this->assertEquals("Error [1871] in line 2: Element 'Invalid': This element is not expected. Expected is one of ( CustomTexts, BookletConfig, States, Units ).", $this->getErrorString($xf));
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
    return $path;
  }

  function test_schemaVersionNewerThanSupported() {
    $xf = new XMLFile($this->writeBookletWithSchema('https://w3id.org/iqb/spec/testcenter-booklet-xml/19.0'));

    $this->assertEquals(
      'XSD schema version `19.0` of `testcenter-booklet-xml` is not supported. Supported major versions: 18 to 18.',
      $this->getErrorString($xf)
    );
  }

  function test_schemaVersionOlderThanSupported() {
    $xf = new XMLFile($this->writeBookletWithSchema('https://w3id.org/iqb/spec/testcenter-booklet-xml/17.4'));

    $this->assertEquals(
      'XSD schema version `17.4` of `testcenter-booklet-xml` is not supported. Supported major versions: 18 to 18.',
      $this->getErrorString($xf)
    );
  }

  function test_schemaVersionUnsupportedWithoutValidation() {
    SystemConfig::$xmlSchema_validation = false;
    $xf = new XMLFile($this->writeBookletWithSchema('https://w3id.org/iqb/spec/testcenter-booklet-xml/19.0'));

    $this->assertEquals(
      'XSD schema version `19.0` of `testcenter-booklet-xml` is not supported. Supported major versions: 18 to 18.',
      $this->getErrorString($xf)
    );
  }

  function test_schemaMissingWithoutValidation() {
    SystemConfig::$xmlSchema_validation = false;
    file_put_contents(DATA_DIR . "/ws_1/no-schema.xml", '<Booklet><Metadata><Id>c</Id><Label>d</Label></Metadata></Booklet>');
    $xf = new XMLFile(DATA_DIR . "/ws_1/no-schema.xml");

    $this->assertEquals(
      'File has no link to XSD-schema. Expected a schema URL like '
      . '`https://w3id.org/iqb/spec/testcenter-booklet-xml/<version>` with major version 18 to 18.',
      $this->getErrorString($xf)
    );
  }

  function test_schemaLegacyUrl() {
    $xf = new XMLFile($this->writeBookletWithSchema(
      'https://raw.githubusercontent.com/iqb-berlin/testcenter/17.4.1/definitions/vo_Booklet.xsd'
    ));

    $this->assertEquals(
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
    $xf = new XMLFile(DATA_DIR . '/ws_1/invalid.xml');

    $this->assertArrayNotHasKey('error', $xf->getValidationReport());
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
    $this->assertEquals($expect, $result, $desc);
  }
}
