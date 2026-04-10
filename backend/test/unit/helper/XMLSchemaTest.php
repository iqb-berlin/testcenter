<?php
/** @noinspection PhpUnhandledExceptionInspection */

use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class XMLSchemaTest extends TestCase {
  public static function setUpBeforeClass(): void {
    require_once "test/unit/mock-classes/ExternalFileMock.php";
    require_once "test/unit/VfsForTest.class.php";
    VfsForTest::setUpBeforeClass();
  }

  function setUp(): void {
    VfsForTest::setUp();
  }

  function tearDown(): void {
    unset($this->vfs);
  }

  private $testUrls = [
    'valid_booklet' => 'https://w3id.org/iqb/spec/testcenter-booklet-xml/17.4',
    'valid_unit' => 'https://w3id.org/iqb/spec/unit-xml/17.4',
    'valid_testtakers' => 'https://w3id.org/iqb/spec/testcenter-testtakers-xml/17.6',
    'valid_syscheck' => 'https://w3id.org/iqb/spec/testcenter-syscheck-xml/17.4',
    'valid_unknown_repo' => 'https://w3id.org/iqb/spec/testcenter-unknown-xml/17.4',
    'invalid_old_github' => 'https://raw.githubusercontent.com/iqb-berlin/testcenter/17.5.3/definitions/vo_Booklet.xsd',
    'invalid_no_version' => 'https://w3id.org/iqb/spec/testcenter-booklet-xml',
    'invalid_wrong_domain' => 'http://www.topografix.com/GPX/1/0',
    'empty' => ''
  ];

  function test_parseSchemaUrl_validUrls(): void {
    $result = XMLSchema::parseSchemaUrl($this->testUrls['valid_booklet']);
    $this->assertEquals([
      'isExternal' => true,
      'repo' => 'testcenter-booklet-xml',
      'type' => 'Booklet',
      'version' => '17.4',
      'uri' => $this->testUrls['valid_booklet']
    ], $result);

    $result = XMLSchema::parseSchemaUrl($this->testUrls['valid_unit']);
    $this->assertEquals([
      'isExternal' => true,
      'repo' => 'unit-xml',
      'type' => 'Unit',
      'version' => '17.4',
      'uri' => $this->testUrls['valid_unit']
    ], $result);
  }

  function test_parseSchemaUrl_emptyUrl(): void {
    $result = XMLSchema::parseSchemaUrl($this->testUrls['empty']);
    $this->assertNull($result);
  }

  function test_parseSchemaUrl_invalidOldGithubUrl(): void {
    $result = XMLSchema::parseSchemaUrl($this->testUrls['invalid_old_github']);
    $this->assertNull($result);
  }

  function test_parseSchemaUrl_invalidNoVersion(): void {
    $result = XMLSchema::parseSchemaUrl($this->testUrls['invalid_no_version']);
    $this->assertNull($result);
  }

  function test_parseSchemaUrl_invalidWrongDomain(): void {
    $result = XMLSchema::parseSchemaUrl($this->testUrls['invalid_wrong_domain']);
    $this->assertNull($result);
  }

  function test_schemaCache(): void {
    $result = XMLSchema::getSchemaFilePath(
      XMLSchema::parseSchemaUrl($this->testUrls['valid_booklet'])
    );
    $this->assertEquals(
      "vfs://root/data/.schemas/testcenter-booklet-xml/17.4/testcenter-booklet-xml.xsd",
      $result
    );

    $this->assertStringStartsWith(
      "<?xml version=\"1.0\" encoding=\"utf-8\"?>",
      file_get_contents($result)
    );
  }

  function test_schemaCache_downloadFails(): void {
    $result = XMLSchema::getSchemaFilePath(
      XMLSchema::parseSchemaUrl($this->testUrls['valid_unknown_repo'])
    );
    $this->assertNull($result);
  }

  function test_getSchemaFilePath_null(): void {
    $result = XMLSchema::getSchemaFilePath(null);
    $this->assertNull($result);
  }
}