<?php
/** @noinspection PhpUnhandledExceptionInspection */

require_once "classes/helper/XMLSchema.class.php";
require_once "unit-tests/VfsForTest.class.php";


use PHPUnit\Framework\TestCase;

class Version {
    static function get() {
        return "7.7.7";
    }
}


class XMLSchemaTest extends TestCase {

    private $vfs;

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        $this->vfs = VfsForTest::setUp();
        $this->testUrls['local_full'] = DATA_DIR . '/definitions/vo_SysCheck.xsd';
    }


    function tearDown(): void {

        unset($this->vfs);
    }

    private $testUrls = [
        'valid' => 'https://raw.githubusercontent.com/iqb-berlin/testcenter-backend/5.0.1/definitions/vo_SysCheck.xsd',
        'valid_but_not_existing' => 'https://raw.githubusercontent.com/iqb-berlin/testcenter-backend/500.0.100/definitions/vo_SysCheck.xsd',
        'valid_but_minor_not_existing' => 'https://raw.githubusercontent.com/iqb-berlin/testcenter-backend/5.0.1000/definitions/vo_SysCheck.xsd',
        'changed_repo_name' => 'https://raw.githubusercontent.com/iqb-berlin/future-repo/11.12.13/definitions/SysCheck.xsd',
        'local' => 'definitions/vo_SysCheck.xsd',
        'invalid' => 'http://www.topografix.com/GPX/1/0'
    ];

    function test_parseSchemaUrl() {

        $this->assertEquals([
            "isUrl"         => true,
            "version"       => '5.0.1',
            "mayor"         => 5,
            "minor"         => 0,
            "patch"         => 1,
            "type"          => 'SysCheck',
            "url"           => $this->testUrls['valid'],
            "filePath"      => ''
        ], XMLSchema::parseSchemaUrl($this->testUrls['valid']));

        $this->assertEquals([
            "isUrl"         => true,
            "version"       => '11.12.13',
            "mayor"         => 11,
            "minor"         => 12,
            "patch"         => 13,
            "type"          => 'SysCheck',
            "url"           => $this->testUrls['changed_repo_name'],
            "filePath"      => ''
        ], XMLSchema::parseSchemaUrl($this->testUrls['changed_repo_name']));

        $this->assertEquals([
            "isUrl"         => false,
            "version"       => '',
            "mayor"         => 0,
            "minor"         => 0,
            "patch"         => 0,
            "type"          => 'SysCheck',
            "url"           => $this->testUrls['local'],
            "filePath"      => ''
        ], XMLSchema::parseSchemaUrl($this->testUrls['local']));

        $this->assertEquals([
            "isUrl"         => false,
            "version"       => '',
            "mayor"         => 0,
            "minor"         => 0,
            "patch"         => 0,
            "type"          => 'SysCheck',
            "url"           => $this->testUrls['local_full'],
            "filePath"      => ''
        ], XMLSchema::parseSchemaUrl($this->testUrls['local_full']));

        $this->assertNull(XMLSchema::parseSchemaUrl($this->testUrls['invalid']));
    }


    function test_schemaCache() {

        $result = XMLSchema::parseSchemaUrl($this->testUrls['valid'], true);
        $this->assertEquals("vfs://root/vo_data/.schemas/SysCheck/v5/SysCheck-5.0.1.xsd", $result['filePath']);
        $this->assertEquals(
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<xs:schema id=\"vo_SysCheck\"",
            $this->readFirstChars($result['filePath'], 66)
        );

        try {
            XMLSchema::parseSchemaUrl($this->testUrls['valid_but_not_existing'], true);
            $this->fail("exepected exception");
        } catch(Exception $e) {}
        $this->assertTrue(file_exists("vfs://root/vo_data/.schemas/SysCheck/v500/SysCheck-500.0.100.xsd"));
        $this->assertTrue(filesize("vfs://root/vo_data/.schemas/SysCheck/v500/SysCheck-500.0.100.xsd") == 0);

        // fake cache file
        copy("vfs://root/vo_data/.schemas/SysCheck/v5/SysCheck-5.0.1.xsd", "vfs://root/vo_data/.schemas/SysCheck/v5/SysCheck-5.0.1000.xsd");
        $result = XMLSchema::parseSchemaUrl($this->testUrls['valid_but_minor_not_existing'], true);
        $this->assertEquals(
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<xs:schema id=\"vo_SysCheck\"",
            $this->readFirstChars($result['filePath'], 66)
        );

        $result = XMLSchema::parseSchemaUrl($this->testUrls['local'], true);
        $this->assertEquals("vfs://root/definitions/vo_SysCheck.xsd", $result['filePath']);
        $this->assertEquals(
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<xs:schema id=\"vo_SysCheck\"",
            $this->readFirstChars($result['filePath'], 66)
        );


        $result = XMLSchema::parseSchemaUrl($this->testUrls['local_full'], true);
        $this->assertEquals("vfs://root/definitions/vo_SysCheck.xsd", $result['filePath']);
        $this->assertEquals(
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<xs:schema id=\"vo_SysCheck\"",
            $this->readFirstChars($result['filePath'], 66)
        );
    }


    private function readFirstChars($filePath, $chars = 50): string {

        $fileHandle = fopen($filePath, 'r');
        $data = fread($fileHandle, $chars);
        fclose($fileHandle);
        return $data;
    }
}
