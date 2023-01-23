<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class WorkspaceDAOTest extends TestCase {

    private WorkspaceDAO $dbc;

    function setUp(): void {

        require_once "src/exception/HttpError.class.php";
        require_once "src/data-collection/DataCollection.class.php";
        require_once "src/data-collection/DataCollectionTypeSafe.class.php";
        require_once "src/data-collection/FileData.class.php";
        require_once "src/helper/DB.class.php";
        require_once "src/helper/JSON.class.php";
        require_once "src/helper/Version.class.php";
        require_once "src/helper/XMLSchema.class.php";
        require_once "src/helper/FileTime.class.php";
        require_once "src/helper/TimeStamp.class.php";
        require_once "src/data-collection/DBConfig.class.php";
        require_once "src/dao/DAO.class.php";
        require_once "src/dao/WorkspaceDAO.class.php";
        require_once "src/files/File.class.php";
        require_once "src/files/XMLFile.class.php";
        require_once "src/files/XMLFileBooklet.class.php";

        DB::connect(new DBConfig(["type" => "temp"]));
        $this->dbc = new WorkspaceDAO(1, '/data_dir/ws_1');
        $this->dbc->runFile(REAL_ROOT_DIR . '/backend/test/database.sql');
        $this->dbc->runFile(REAL_ROOT_DIR . '/backend/test/unit/testdata.sql');
        define('ROOT_DIR', REAL_ROOT_DIR);
    }


    public function test_getGlobalIds(): void {

        $expectation = [
            1 => [
                'testdata.sql' => [
                    'login' => ['future_user', 'monitor', 'sample_user', 'test', 'test-expired'],
                    'group' => ['sample_group']
                ]
            ]
        ];
        $result = $this->dbc->getGlobalIds();
        $this->assertEquals($expectation, $result);
    }


    public function test_getWorkspaceName(): void {

        $result = $this->dbc->getWorkspaceName(1);
        $expectation = 'example_workspace';
        $this->assertEquals($expectation, $result);
    }


    // TODO! make a test for adding
    public function test_storeFileMeta_overwrite(): void {

        $file = XMLFileBooklet::fromString('<Booklet><Metadata><Id>BOOKLET.SAMPLE-1</Id><Label>l</Label></Metadata><Units><Unit label="l" id="x_unit" /></Units></Booklet>', 'Booklet.xml');
//        $file->readFileMeta(REAL_ROOT_DIR . '/sampledata/Booklet.xml');

        $this->dbc->storeFile($file);
        $files = $this->dbc->_("select *, 'ignore' as validation_report from files where type = 'Booklet'", [], true);
        $expectation = [
            [
                'workspace_id' => 1,
                'name' => 'Booklet-no-test.xml',
                'id' => 'BOOKLET.NO.TEST',
                'version_mayor' => null,
                'version_minor' => null,
                'version_patch' => null,
                'version_label' => null,
                'label' => 'Booklet without test',
                'description' => 'No test yet',
                'type' => 'Booklet',
                'verona_module_type' => null,
                'verona_version' => null,
                'verona_module_id' => null,
                'is_valid' => 0,
                'validation_report' => 'ignore',
                'modification_ts' => '2023-01-16 09:00:00',
                'size' => 195,
                'context_data' => null
            ],
            [
                'workspace_id' => 1,
                'name' => 'Booklet.xml',
                'id' => 'BOOKLET.SAMPLE-1',
                'version_mayor' => 0,
                'version_minor' => 0,
                'version_patch' => 0,
                'version_label' => '',
                'label' => 'l',
                'description' => '',
                'type' => 'Booklet',
                'verona_module_type' => '',
                'verona_version' => '',
                'verona_module_id' => '',
                'is_valid' => 1,
                'validation_report' => 'ignore',
                'modification_ts' => '1970-01-01 01:00:01',
                'size' => 0,
                'context_data' => 'a:0:{}'
            ]
        ];
        $this->assertEquals($expectation, $files);
    }
}
