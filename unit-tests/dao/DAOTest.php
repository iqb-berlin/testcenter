<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/exception/HttpError.class.php";
require_once "classes/data-collection/DataCollection.class.php";
require_once "classes/helper/DB.class.php";
require_once "classes/data-collection/DBConfig.class.php";
require_once "classes/dao/DAO.class.php";



class DAOTest extends TestCase {

    private $dbc;
    /* @type DAO
     * @throws Exception
     */

    function setUp(): void {

        DB::connect(new DBConfig(["type" => "temp"]));
        $this->dbc = new AdminDAO();
        $this->dbc->runFile('scripts/sql-schema/sqlite.sql');
        $this->dbc->runFile('unit-tests/testdata.sql');
    }


    function tearDown(): void {

        unset($this->dbc);
    }


    function test_getDBSchemaVersion() {

        $result = $this->dbc->getDBSchemaVersion();
        $this->assertEquals('0.0.0-no-entry', $result, 'No entry in meta table');

        $this->dbc->_("INSERT INTO meta (metaKey, value) VALUES ('dbSchemaVersion', '10.0.0')");
        $result = $this->dbc->getDBSchemaVersion();
        $this->assertEquals('10.0.0', $result, 'Version present');

        $this->dbc->_("Drop Table meta");
        $result = $this->dbc->getDBSchemaVersion();
        $this->assertEquals('0.0.0-no-table', $result, 'No meta table present');
    }
}
