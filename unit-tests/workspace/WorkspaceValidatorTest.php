<?php

/** @noinspection PhpIllegalPsrClassPathInspection */

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

//require_once "classes/helper/FileSize.class.php";
require_once "classes/helper/FileName.class.php";
//require_once "classes/helper/Folder.class.php";
//require_once "classes/files/ResourceFile.class.php";
require_once "classes/files/XMLFile.php";
//require_once "classes/files/XMLFileError.php";
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

        $this->vfs = VfsForTest::setUp(true);

        $this->validator = new WorkspaceValidator(1);
    }

//    private function invokeMethod($methodName, array $parameters = array()) {
//
//        $reflection = new ReflectionClass(get_class($this->validator));
//        $method = $reflection->getMethod($methodName);
//        $method->setAccessible(true);
//
//        return $method->invokeArgs($this->validator, $parameters);
//    }


    function test_validate() {

        $result = $this->validator->validate();

        $expected = [
            '.' => [
                new ValidationReportEntry('info', '`1` valid Testtakers-files found'),
                new ValidationReportEntry('info', '`2` valid Booklet-files found'),
                new ValidationReportEntry('info', '`2` valid Resource-files found'),
                new ValidationReportEntry('info', '`2` valid Unit-files found'),
                new ValidationReportEntry('info', '`1` valid SysCheck-files found'),
//                new ValidationReportEntry('info', '`10` valid Testtakers-files in `10` logins found'),
            ],
            'Testtakers/testtakers-duplicate-login-name.xml' => [
                new ValidationReportEntry('error',  'Duplicate login: `duplicate_login`'),
            ],
            'Testtakers/testtakers-missing-booklet.xml' => [
                new ValidationReportEntry('error', 'Booklet `BOOKLET.MISSING` not found for login `a_login`')
            ],
            'Testtakers/trash.xml' => [
                new ValidationReportEntry('error', 'Invalid root-tag: `Trash`'),
            ],
            'Testtakers/testtakers-broken.xml' => [
                new ValidationReportEntry('error',  'Error [76] in line 6: Opening and ending tag mismatch: Testtakers line 2 and Metadata'),
                new ValidationReportEntry('error',  'Error [5] in line 8: Extra content at the end of the document'),
                new ValidationReportEntry('error',  'Invalid File')
            ],
            'Booklet/trash.xml' => [
                new ValidationReportEntry('warning', 'Booklet is never used'),
                new ValidationReportEntry('error', 'Invalid root-tag: `Trash`'),
            ],
            'Booklet/booklet-broken.xml' => [
                new ValidationReportEntry('warning', 'Booklet is never used'),
                new ValidationReportEntry('error',  'Error [76] in line 35: Opening and ending tag mismatch: Booklet line 2 and Units'),
                new ValidationReportEntry('error',  'Error [5] in line 36: Extra content at the end of the document'),
                new ValidationReportEntry('error',  'Invalid File')
            ],
            'Booklet/booklet-duplicate-id-1.xml' => [
                new ValidationReportEntry('error',  'Duplicate Booklet-Id: `DUPLICATE_BOOKLET_ID` `(booklet-duplicate-id-2.xml)`'),
            ],
            'Booklet/booklet-duplicate-id-2.xml' => [
                new ValidationReportEntry('error',  'Duplicate Booklet-Id: `DUPLICATE_BOOKLET_ID` `(booklet-duplicate-id-1.xml)`'),
            ],
            'Booklet/SAMPLE_BOOKLET.XML' => [
                new ValidationReportEntry('info',  'size fully loaded: `8.27 KB`'),
            ],
            'Booklet/SAMPLE_BOOKLET2.XML' => [
                new ValidationReportEntry('info',  'size fully loaded: `6.24 KB`'),
            ],
            'Unit/unit-unused-and-missing-player.xml' => [
                new ValidationReportEntry('warning', 'Unit is never used'),
                new ValidationReportEntry('error', 'unit definition type `MISSING-PLAYER.HTML` not found'),
            ],
            'Unit/unit-unused-and-missing-ref.xml' => [
                new ValidationReportEntry('warning', 'Unit is never used'),
                new ValidationReportEntry('error', 'definitionRef `not-existing.voud` not found')
            ],
            'Resource/resource-unused.voud' => [
                new ValidationReportEntry('warning', 'Resource is never used'),
            ],
            'Testtakers/testtakers-duplicate-login-name-cross-file-1.xml' => [
                new ValidationReportEntry('error', "Duplicate login: `double_login` - also in file `testtakers-duplicate-login-name-cross-file-2.xml`")
            ],
            'Testtakers/testtakers-duplicate-login-name-cross-file-2.xml' => [
                new ValidationReportEntry('error', "Duplicate login: `double_login` - also in file `testtakers-duplicate-login-name-cross-file-1.xml`")
            ],
            'Testtakers/testtakers-duplicate-login-name-cross-ws.xml' => [
                new ValidationReportEntry('error', "Duplicate group: `another_group` - also on workspace 2 in file `testtakers-duplicate-login-name-cross-ws.xml`"),
                new ValidationReportEntry('error', "Duplicate login: `another_login` - also on workspace 2 in file `testtakers-duplicate-login-name-cross-ws.xml`")
            ]
        ];


//        var_dump($result);

        foreach ($result as $key => $list) {

//            if ($key === '.') {
//                continue;
//            }

//            echo "\n-<R>- $key: " . count($list);

//            var_dump($list);

            if (!isset($expected[$key])) {
//                var_dump($result[$key]);
                $this->fail("key `$key` not asserted");
            }

            $expect = $expected[$key];

            usort($expect, function(ValidationReportEntry $a, ValidationReportEntry $b) {
                return strcmp($a->message, $b->message);
            });

            usort($list, function(ValidationReportEntry $a, ValidationReportEntry $b) {
                return strcmp($a->message, $b->message);
            });

            $this->assertEquals($expect, $list);
        }

        foreach ($expected as $key => $list) {

//            echo "\n-<E>- $key: " . count($list);

            if (!isset($result[$key])) {
//                echo " !!! IS MISSING !!!";
                $this->fail("key `$key` missing");
            }
        }
    }

}
