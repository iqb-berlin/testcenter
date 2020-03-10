<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/data/DBConfig.class.php";
require_once "classes/dao/DAO.class.php";


class DAOTest extends TestCase {

    private $dbc;
    /* @type DAO
     * @throws Exception
     */

    const admin_token = 'admin_token';

    function setUp() {

        $this->dbc = new DAO(new DBConfig(array("type" => "temp")));
        $this->dbc->runFile('scripts/sql-schema/sqlite.sql'); // TODO split database schema and test data
    }


    function tearDown() {

        unset($this->dbc);
    }
}
