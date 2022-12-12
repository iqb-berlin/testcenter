<?php

/** @noinspection PhpIllegalPsrClassPathInspection */

declare(strict_types=1);

use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class WorkspaceValidatorTest extends TestCase{

    private WorkspaceValidator $validator;
    private WorkspaceDAO $workspaceDaoMock;

    public static function setUpBeforeClass(): void {

        require_once "test/unit/VfsForTest.class.php";
        VfsForTest::setUpBeforeClass();
    }


    function setUp(): void {

        require_once "src/data-collection/DataCollectionTypeSafe.class.php";
        require_once "src/data-collection/ValidationReportEntry.class.php";
        require_once "src/data-collection/VeronaModuleMeta.class.php";
        require_once "src/data-collection/Login.class.php";
        require_once "src/data-collection/LoginArray.class.php";
        require_once "src/data-collection/Group.class.php";
        require_once "src/data-collection/RequestedAttachment.class.php";
        require_once "src/helper/FileName.class.php";
        require_once "src/helper/Version.class.php";
        require_once "src/helper/JSON.class.php";
        require_once "src/helper/XMLSchema.class.php";
        require_once "src/helper/TimeStamp.class.php";
        require_once "src/helper/FileTime.class.php";
        require_once "src/helper/FileExt.class.php";
        require_once "src/data-collection/FileData.class.php";
        require_once "src/files/File.class.php";
        require_once "src/files/XMLFile.class.php";
        require_once "src/files/XMLFileSysCheck.class.php";
        require_once "src/files/XMLFileBooklet.class.php";
        require_once "src/files/XMLFileUnit.class.php";
        require_once "src/files/XMLFileTesttakers.class.php";
        require_once "src/files/ResourceFile.class.php";
        require_once "src/workspace/Workspace.class.php";
        require_once "src/workspace/WorkspaceValidator.class.php";

        require_once "test/unit/mock-classes/ExternalFileMock.php";
        require_once "test/unit/mock-classes/PasswordMock.php";
        require_once "test/unit/mock-classes/ZIPMock.php";

        $this->workspaceDaoMock = Mockery::mock('overload:' . WorkspaceDAO::class);
        $this->workspaceDaoMock->allows([
            'getGlobalIds' => VfsForTest::globalIds
        ]);
        VfsForTest::setUp(true);
        $this->validator = new WorkspaceValidator(new Workspace(1));
    }


    function test_validate() {

        $result = $this->validator->validate();

        $version = Version::get();

        $expected = [
            'Testtakers/testtakers-duplicate-login-name.xml' => [
                new ValidationReportEntry('error',  'Duplicate login: `duplicate_login`'),
                new ValidationReportEntry('warning', "File has no link to XSD-Schema. Current version (`$version`) will be used instead.")
            ],
            'Testtakers/testtakers-missing-booklet.xml' => [
                new ValidationReportEntry('error', 'Booklet `BOOKLET.MISSING` not found for login `a_login`'),
                new ValidationReportEntry('warning', "File has no link to XSD-Schema. Current version (`$version`) will be used instead.")
            ],
            'Testtakers/trash.xml' => [
                new ValidationReportEntry('error', 'Invalid root-tag: `Trash`'),
            ],
            'Testtakers/testtakers-broken.xml' => [
                new ValidationReportEntry('error',  'Error [76] in line 6: Opening and ending tag mismatch: Testtakers line 2 and Metadata'),
                new ValidationReportEntry('error',  'Error [5] in line 8: Extra content at the end of the document')
            ],
            'Booklet/trash.xml' => [
                new ValidationReportEntry('warning', 'Booklet is never used'),
                new ValidationReportEntry('error', 'Invalid root-tag: `Trash`'),
            ],
            'Booklet/booklet-broken.xml' => [
                new ValidationReportEntry('warning', 'Booklet is never used'),
                new ValidationReportEntry('error',  'Error [5] in line 34: Extra content at the end of the document'),
                new ValidationReportEntry('error',  'Error [76] in line 33: Opening and ending tag mismatch: Booklet line 2 and Units'),
            ],
            'Booklet/booklet-duplicate-id-1.xml' => [
                new ValidationReportEntry('warning', "File has no link to XSD-Schema. Current version (`$version`) will be used instead."),
                new ValidationReportEntry('error',  'Duplicate Booklet-Id: `DUPLICATE_BOOKLET_ID` (`booklet-duplicate-id-2.xml`)'),
                new ValidationReportEntry('warning', 'Booklet is never used'),
            ],
            'Booklet/booklet-duplicate-id-2.xml' => [
                new ValidationReportEntry('error',  'Duplicate Booklet-Id: `DUPLICATE_BOOKLET_ID` (`booklet-duplicate-id-1.xml`)'),
                new ValidationReportEntry('warning', "File has no link to XSD-Schema. Current version (`$version`) will be used instead."),
            ],
            'Unit/unit-unused-and-missing-player.xml' => [
                new ValidationReportEntry('warning', 'Unit is never used'),
                new ValidationReportEntry('warning', "File has no link to XSD-Schema. Current version (`$version`) will be used instead."),
                new ValidationReportEntry('error', 'No suitable version of `MISSING-PLAYER.HTML` found'),
            ],
            'Unit/unit-unused-and-missing-ref.xml' => [
                new ValidationReportEntry('warning', 'Unit is never used'),
                new ValidationReportEntry('error', 'Resource `not-existing.voud` not found'),
                new ValidationReportEntry('warning', "File has no link to XSD-Schema. Current version (`$version`) will be used instead.")
            ],
            'Unit/SAMPLE_UNIT.XML' => [
                new ValidationReportEntry('info', "`1` attachment(s) requested.")
            ],
            'Unit/SAMPLE_UNIT2.XML' => [
                new ValidationReportEntry('warning', "Element `/Unit/Definition/@type` is deprecated.")
            ],
            'Resource/resource-unused.voud' => [
                new ValidationReportEntry('warning', 'Resource is never used'),
            ],
            'Testtakers/testtakers-duplicate-login-name-cross-file-1.xml' => [
                new ValidationReportEntry('error', "Duplicate login: `double_login` - also in file `testtakers-duplicate-login-name-cross-file-2.xml`"),
                new ValidationReportEntry('warning', "File has no link to XSD-Schema. Current version (`$version`) will be used instead.")
            ],
            'Testtakers/testtakers-duplicate-login-name-cross-file-2.xml' => [
                new ValidationReportEntry('error', "Duplicate login: `double_login` - also in file `testtakers-duplicate-login-name-cross-file-1.xml`"),
                new ValidationReportEntry('warning', "File has no link to XSD-Schema. Current version (`$version`) will be used instead.")
            ],
            'Testtakers/testtakers-duplicate-login-name-cross-ws.xml' => [
                new ValidationReportEntry('error', "Duplicate group: `another_group` - also on workspace 2 in file `testtakers-duplicate-login-name-cross-ws.xml`"),
                new ValidationReportEntry('error', "Duplicate login: `another_login` - also on workspace 2 in file `testtakers-duplicate-login-name-cross-ws.xml`"),
                new ValidationReportEntry('warning', "File has no link to XSD-Schema. Current version (`$version`) will be used instead.")
            ],
            'Resource/verona-player-simple-4.0.0.html' => [
                new ValidationReportEntry('info', 'Verona-Version: 4.0')
            ],
            'Resource/sample_resource_package.itcr.zip' => [
                new ValidationReportEntry('info', 'Contains 0 files.')
            ]
        ];

        foreach ($result as $key => $list) {

            if (!isset($expected[$key])) {
                $this->fail("File-Report `$key` not expected:" . print_r($list, true));
            }

            $expect = $expected[$key];

            usort($expect, function(ValidationReportEntry $a, ValidationReportEntry $b) {
                return strcmp($a->message, $b->message);
            });

            usort($list, function(ValidationReportEntry $a, ValidationReportEntry $b) {
                return strcmp($a->message, $b->message);
            });

            $this->assertEquals($expect, $list, "File-Report of `$key`:" . print_r($list, true));
        }

        foreach ($expected as $key => $list) {

            if (!isset($result[$key])) {
                $this->fail("File-Report `$key` is missing");
            }
        }
    }


    function test_getResource() {

        $result = $this->validator->getResource('verona-player-simple-4.0.0.html', true);
        $expectation = "verona-player-simple-4.0.0.html";
        $this->assertEquals($expectation, $result->getName());

        $result = $this->validator->getResource('missing_player.html', true);
        $this->assertNull($result);

        // more scenarios are implicitly tested with test_getPlayerIfExists in XMLFilesUnitTest
    }


    function test_getUsedBy() {

        $this->validator->validate();
        $resourceFile = $this->validator->getResource('verona-player-simple-4.0.0.html', true);

        $expectation = [
            'Unit/SAMPLE_UNIT.XML',
            'Booklet/SAMPLE_BOOKLET.XML',
            'Testtakers/SAMPLE_TESTTAKERS.XML',
            'Booklet/SAMPLE_BOOKLET2.XML',
            'Booklet/SAMPLE_BOOKLET3.XML',
            'Unit/SAMPLE_UNIT2.XML',
            'SysCheck/SAMPLE_SYSCHECK.XML'
        ];
        $result = array_keys($resourceFile->getUsedBy());
        $this->assertEquals($expectation, $result);
    }
}
