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
    require_once "test/unit/VfsForTest.class.php";
    VfsForTest::setUpBeforeClass();
  }

  function setUp(): void {
    VfsForTest::setUp();
    $this->testUrls['local_full'] = DATA_DIR . '/definitions/vo_SysCheck.xsd';
  }

  function tearDown(): void {
    unset($this->vfs);
  }

  private $testUrls = [
    'valid' => 'https://raw.githubusercontent.com/iqb-berlin/testcenter-backend/5.0.1/definitions/vo_SysCheck.xsd',
    'valid_with_label' => 'https://raw.githubusercontent.com/iqb-berlin/testcenterd/130.0.0-alpha/definitions/vo_SysCheck.xsd',
    'valid_but_not_existing' => 'https://raw.githubusercontent.com/iqb-berlin/testcenter-backend/500.0.100/definitions/vo_SysCheck.xsd',
    'valid_but_minor_not_existing' => 'https://raw.githubusercontent.com/iqb-berlin/testcenter-backend/5.0.1000/definitions/vo_SysCheck.xsd',
    'valid_incomplete_version' => 'https://raw.githubusercontent.com/iqb-berlin/testcenter-backend/5.1/definitions/vo_SysCheck.xsd',
    'changed_repo_name' => 'https://raw.githubusercontent.com/iqb-berlin/future-repo/11.12.13/definitions/SysCheck.xsd',
    'local' => '../definitions/vo_SysCheck.xsd',
    'invalid' => 'http://www.topografix.com/GPX/1/0',
    'empty' => ''
  ];

  function test_parseSchemaUrl() {
    $this->assertEquals([
      "isExternal" => true,
      "version" => '5.0.1',
      "mayor" => 5,
      "minor" => 0,
      "patch" => 1,
      "type" => 'SysCheck',
      "uri" => $this->testUrls['valid'],
      "label" => ''
    ], XMLSchema::parseSchemaUrl($this->testUrls['valid']));

    $this->assertEquals([
      "isExternal" => true,
      "version" => '11.12.13',
      "mayor" => 11,
      "minor" => 12,
      "patch" => 13,
      "type" => 'SysCheck',
      "uri" => $this->testUrls['changed_repo_name'],
      "label" => ''
    ], XMLSchema::parseSchemaUrl($this->testUrls['changed_repo_name']));

    $this->assertEquals([
      "isExternal" => false,
      "version" => '',
      "mayor" => 0,
      "minor" => 0,
      "patch" => 0,
      "type" => 'SysCheck',
      "uri" => $this->testUrls['local'],
      "label" => ''
    ], XMLSchema::parseSchemaUrl($this->testUrls['local']));

    $this->assertEquals([
      "isExternal" => false,
      "version" => '',
      "mayor" => 0,
      "minor" => 0,
      "patch" => 0,
      "type" => 'SysCheck',
      "uri" => $this->testUrls['local_full'],
      "label" => ''
    ], XMLSchema::parseSchemaUrl($this->testUrls['local_full']));

    $this->assertEquals([
      "isExternal" => true,
      "version" => '',
      "mayor" => 0,
      "minor" => 0,
      "patch" => 0,
      "type" => 'SysCheck',
      "uri" => $this->testUrls['valid_incomplete_version'],
      "label" => ''
    ], XMLSchema::parseSchemaUrl($this->testUrls['valid_incomplete_version']));

    $this->assertEquals([
      "isExternal" => true,
      "version" => '130.0.0-alpha',
      "mayor" => 130,
      "minor" => 0,
      "patch" => 0,
      "label" => 'alpha',
      "type" => 'SysCheck',
      "uri" => $this->testUrls['valid_with_label']
    ], XMLSchema::parseSchemaUrl($this->testUrls['valid_with_label']));

    $this->assertNull(XMLSchema::parseSchemaUrl($this->testUrls['invalid']));
    $this->assertNull(XMLSchema::parseSchemaUrl($this->testUrls['empty']));
  }

  function test_schemaCache() {
    $result = XMLSchema::getSchemaFilePath(XMLSchema::parseSchemaUrl($this->testUrls['valid']));
    $this->assertEquals("vfs://root/data/.schemas/SysCheck/v5/SysCheck-5.0.1.xsd", $result);
    $this->assertEquals(
      "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<xs:schema id=\"vo_SysCheck\"",
      $this->readFirstChars($result, 66)
    );

//        try {
    XMLSchema::getSchemaFilePath(XMLSchema::parseSchemaUrl($this->testUrls['valid_but_not_existing']));
//            $this->fail("exepected exception");
//        } catch(Exception $e) {}
    $this->assertTrue(file_exists("vfs://root/data/.schemas/SysCheck/v500/SysCheck-500.0.100.xsd"));
    $this->assertTrue(filesize("vfs://root/data/.schemas/SysCheck/v500/SysCheck-500.0.100.xsd") == 0);

    // fake cache file
    copy("vfs://root/data/.schemas/SysCheck/v5/SysCheck-5.0.1.xsd", "vfs://root/data/.schemas/SysCheck/v5/SysCheck-5.0.1000.xsd");
    $result = XMLSchema::getSchemaFilePath(XMLSchema::parseSchemaUrl($this->testUrls['valid_but_minor_not_existing']));
    $this->assertEquals(
      "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<xs:schema id=\"vo_SysCheck\"",
      $this->readFirstChars($result, 66)
    );

    $result = XMLSchema::getSchemaFilePath(XMLSchema::parseSchemaUrl($this->testUrls['local']));
    $this->assertEquals("vfs://root/definitions/vo_SysCheck.xsd", $result);
    $this->assertEquals(
      "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<xs:schema id=\"vo_SysCheck\"",
      $this->readFirstChars($result, 66)
    );

    $result = XMLSchema::getSchemaFilePath(XMLSchema::parseSchemaUrl($this->testUrls['local_full']));
    $this->assertEquals("vfs://root/definitions/vo_SysCheck.xsd", $result);
    $this->assertEquals(
      "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<xs:schema id=\"vo_SysCheck\"",
      $this->readFirstChars($result, 66)
    );
  }

  private function readFirstChars($filePath, $chars = 50): string {
    $fileHandle = fopen($filePath, 'r');
    $data = fread($fileHandle, $chars);
    fclose($fileHandle);
    return $data;
  }
}
