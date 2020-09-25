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
                new ValidationReportEntry('info', '`2` resource files found'),
                new ValidationReportEntry('info', '`2` valid units found'),
                new ValidationReportEntry('info', '`4` valid booklets found'),
                new ValidationReportEntry('info', '`1` valid sys-checks found'),
                new ValidationReportEntry('info', '`19` test-takers in `10` logins found'),
            ],
            'unit-unused-and-missing-player.xml' => [
                new ValidationReportEntry('error', 'unit definition type `NOT-EXISTING.HTML` not found'),
            ],
            'unit-unused-and-missing-ref.xml' => [
                new ValidationReportEntry('error', 'definitionRef `not-existing.voud` not found')
            ],
            'trash.xml' => [
                new ValidationReportEntry('error', 'Invalid root-tag: `Trash`'),
            ],
            'booklet-broken.xml' => [
                new ValidationReportEntry('error',  'Error in `vfs://root/vo_data/ws_1/Booklet/booklet-broken.xml`'),
                new ValidationReportEntry('error',  'Error [76] in line 35: Opening and ending tag mismatch: Booklet line 2 and Units'),
                new ValidationReportEntry('error',  'Error [5] in line 36: Extra content at the end of the document')
            ],
            'booklet-duplicate-id.xml' => [
//                new ValidationReportEntry('error',  'booklet id `BOOKLET.SAMPLE` is already used'), TODO
                new ValidationReportEntry('info', 'size fully loaded: `6.37 KB`'),
            ],
            'testtakers-broken.xml' => [
                new ValidationReportEntry('error',  'Error in `vfs://root/vo_data/ws_1/Testtakers/testtakers-broken.xml`'),
                new ValidationReportEntry('error',  'Error [76] in line 6: Opening and ending tag mismatch: Testtakers line 2 and Metadata'),
                new ValidationReportEntry('error',  'Error [5] in line 8: Extra content at the end of the document')
            ],
            'testtakers-duplicate-login-name.xml' => [
                new ValidationReportEntry('error',  'duplicate loginname `the-same-name`'),
                new ValidationReportEntry('error',  'Duplicate Group-Id: `sample_group` -  in file `SAMPLE_TESTTAKERS.XML`'),
                new ValidationReportEntry('error',  'Duplicate Group-Id: `review_group` -  in file `SAMPLE_TESTTAKERS.XML`'),
                new ValidationReportEntry('error',  'Duplicate Group-Id: `trial_group` -  in file `SAMPLE_TESTTAKERS.XML`'),
                new ValidationReportEntry('error',  'Duplicate Group-Id: `passwordless_group` -  in file `SAMPLE_TESTTAKERS.XML`'),
                new ValidationReportEntry('error',  'Duplicate Group-Id: `expired_group` -  in file `SAMPLE_TESTTAKERS.XML`'),
                new ValidationReportEntry('error',  'Duplicate Group-Id: `future_group` -  in file `SAMPLE_TESTTAKERS.XML`'),
            ],
            'testtakers-missing-booklet.xml' => [
                new ValidationReportEntry('error', 'booklet `BOOKLET.MISSING` not found for login `a_login`')
            ],
            'SAMPLE_TESTTAKERS.XML' => [
                new ValidationReportEntry('error',  'Duplicate Group-Id: `sample_group` -  in file `testtakers-duplicate-login-name.xml`'),
                new ValidationReportEntry('error',  'Duplicate Group-Id: `review_group` -  in file `testtakers-duplicate-login-name.xml`'),
                new ValidationReportEntry('error',  'Duplicate Group-Id: `trial_group` -  in file `testtakers-duplicate-login-name.xml`'),
                new ValidationReportEntry('error',  'Duplicate Group-Id: `passwordless_group` -  in file `testtakers-duplicate-login-name.xml`'),
                new ValidationReportEntry('error',  'Duplicate Group-Id: `expired_group` -  in file `testtakers-duplicate-login-name.xml`'),
                new ValidationReportEntry('error',  'Duplicate Group-Id: `future_group` -  in file `testtakers-duplicate-login-name.xml`'),
            ],
            'RESOURCE-UNUSED.VOUD' => [
                new ValidationReportEntry('warning', 'Resource is never used'),
            ],
            "UNUSED-BOOKLET" => [ // TODO booklet-unused.xml
                new ValidationReportEntry('warning', 'Booklet not set up for any test-taker'),
            ],
            "booklet-unused.xml" => [
                new ValidationReportEntry('info', 'size fully loaded: `6.37 KB`'),
            ],
            'SAMPLE_BOOKLET.XML' => [
                new ValidationReportEntry('info',  'size fully loaded: `8.27 KB`'),
            ],
            'SAMPLE_BOOKLET2.XML' => [
                new ValidationReportEntry('info',  'size fully loaded: `6.24 KB`'),
            ]
        ];


        foreach ($result as $key => $list) {

            echo "\n-<R>- $key: " . count($list);

//            var_dump($list);

            if (!isset($expected[$key])) {
                var_dump($result[$key]);
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

            echo "\n-<E>- $key: " . count($list);

            if (!isset($result[$key])) {
                echo "!!! IS MISSING !!!";
                $this->fail("key `$key` missing");
            }
        }
    }

}
