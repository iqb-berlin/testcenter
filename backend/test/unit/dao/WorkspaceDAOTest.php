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
        require_once "src/data-collection/ValidationReportEntry.class.php";
        require_once "src/data-collection/PlayerMeta.class.php";
        require_once "src/data-collection/FileSpecialInfo.class.php";
        require_once "src/helper/DB.class.php";
        require_once "src/helper/JSON.class.php";
        require_once "src/helper/Version.class.php";
        require_once "src/helper/XMLSchema.class.php";
        require_once "src/helper/FileTime.class.php";
        require_once "src/data-collection/DBConfig.class.php";
        require_once "src/dao/DAO.class.php";
        require_once "src/dao/WorkspaceDAO.class.php";
        require_once "src/files/File.class.php";
        require_once "src/files/XMLFile.class.php";
        require_once "src/files/XMLFileBooklet.class.php";

        DB::connect(new DBConfig(["type" => "temp"]));
        $this->dbc = new WorkspaceDAO();
        $this->dbc->runFile(REAL_ROOT_DIR . '/backend/test/unit/database.sql');
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


    public function test_storeFileMeta(): void {

        $file = new XMLFileBooklet('<Booklet><Metadata><Id>BOOKLET.SAMPLE-1</Id><Label>l</Label></Metadata><Units><Unit label="l" id="x_unit" /></Units></Booklet>', false, true);
        $file->setFilePath(REAL_ROOT_DIR . '/sampledata/Booklet.xml');

        $this->dbc->storeFileMeta(1, $file);
        $files = $this->dbc->_("select * from files", [], true);
        $expectation = [
            [
                'workspace_id' => '1',
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
            ],
            [
                'workspace_id' => '1',
                'name' => 'Booklet.xml',
                'id' => 'BOOKLET.SAMPLE-1',
                'version_mayor' => '0',
                'version_minor' => '0',
                'version_patch' => '0',
                'version_label' => '',
                'label' => 'l',
                'description' => '',
                'type' => 'Booklet',
                'verona_module_type' => '',
                'verona_version' => '',
                'verona_module_id' => ''
            ]
        ];
        $this->assertEquals($expectation, $files);
    }
}
