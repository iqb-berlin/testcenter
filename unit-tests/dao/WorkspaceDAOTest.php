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

        require_once "classes/exception/HttpError.class.php";
        require_once "classes/data-collection/DataCollection.class.php";
        require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
        require_once "classes/data-collection/ValidationReportEntry.class.php";
        require_once "classes/data-collection/PlayerMeta.class.php";
        require_once "classes/data-collection/FileSpecialInfo.class.php";
        require_once "classes/helper/DB.class.php";
        require_once "classes/helper/JSON.class.php";
        require_once "classes/helper/Version.class.php";
        require_once "classes/helper/XMLSchema.class.php";
        require_once "classes/data-collection/DBConfig.class.php";
        require_once "classes/dao/DAO.class.php";
        require_once "classes/dao/WorkspaceDAO.class.php";
        require_once "classes/files/File.class.php";
        require_once "classes/files/XMLFile.class.php";
        require_once "classes/files/XMLFileBooklet.class.php";

        DB::connect(new DBConfig(["type" => "temp"]));
        $this->dbc = new WorkspaceDAO();
        $this->dbc->runFile(REAL_ROOT_DIR . '/scripts/sql-schema/sqlite.sql');
        $this->dbc->runFile(REAL_ROOT_DIR . '/unit-tests/testdata.sql');
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

        $bookletXML = '<Booklet><Metadata><Id>x_booklet</Id><Label>l</Label></Metadata><Units><Unit label="l" id="x_unit" /></Units></Booklet>';

        $this->dbc->storeFileMeta(1, new XMLFileBooklet($bookletXML, false, true));
        $files = $this->dbc->_("select * from files", [], true);
        $expectation = [
            [
                "workspace_id" => 1,
                "name" => "",
                "id" => "X_BOOKLET",
                "version_mayor" => 0,
                "version_minor" => 0,
                "version_patch" => 0,
                "version_label" => "",
                "label" => "l",
                "description" => "",
                "type" => "Booklet",
                "verona_module_type" => "",
                "verona_version" => "",
                "verona_module_id" => ""
            ]
        ];
        $this->assertEquals($expectation, $files);
    }
}
