<?php

/** @noinspection PhpIllegalPsrClassPathInspection */

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

//require_once "classes/helper/FileSize.class.php";
require_once "classes/helper/FileName.class.php";
//require_once "classes/helper/Folder.class.php";
//require_once "classes/files/ResourceFile.class.php";
require_once "classes/files/XMLFile.php";
//require_once "classes/files/XMLFileTesttakers.php";
require_once "classes/files/XMLFileSysCheck.php";
require_once "classes/files/XMLFileBooklet.php";
require_once "classes/files/XMLFileUnit.php";
require_once "VfsForTest.class.php";
require_once "classes/workspace/WorkspaceValidator.class.php";
require_once "classes/data-collection/ValidationReportEntry.class.php";

class WorkspaceValidatorTest extends TestCase{


    private $vfs;
    private WorkspaceValidator $validator;

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        $this->vfs = VfsForTest::setUp();
        $this->validator = new WorkspaceValidator(1);
    }

    private function invokeMethod($methodName, array $parameters = array()) {

        $reflection = new ReflectionClass(get_class($this->validator));
        $method = $reflection->getMethod($methodName);
        $method->setAccessible(true);

        return $method->invokeArgs($this->validator, $parameters);
    }


    function test_validate() {

        $shit = $this->validator->validate();
        $expected = [
            '.' => [
                new ValidationReportEntry('info', '`1` resource files found'),
                new ValidationReportEntry('info', '`2 valid units found'),
                new ValidationReportEntry('info', '`2` valid booklets found'),
                new ValidationReportEntry('info', '`1` valid sys-checks found'),
                new ValidationReportEntry('info', '`9` test-takers in `8` logins found'),
            ],
            'trash.xml' => [
                new ValidationReportEntry('error', 'Error reading Booklet-XML-file: `vfs://root/vo_data/ws_1/Booklet/trash.xml: Root-Tag "Trash" unknown.`'),
                new ValidationReportEntry('error', 'Error reading test-takers-XML-file: `vfs://root/vo_data/ws_1/Testtakers/trash.xml: Root-Tag "Trash" unknown.`'),
            ],
            'BOOKLET.SAMPLE' => [
                new ValidationReportEntry('info',  'size fully loaded: `8.27 KB`'),
            ],
            'BOOKLET.SAMPLE-2' => [
                new ValidationReportEntry('info',  'size fully loaded: `6.24 KB`'),
            ]
        ];

        $this->assertEquals($expected, $shit);
    }

}
