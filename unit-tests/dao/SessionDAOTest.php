<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/exception/HttpError.class.php";
require_once "classes/data-collection/DataCollection.class.php";
require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
require_once "classes/helper/DB.class.php";
require_once "classes/helper/JSON.class.php";
require_once "classes/data-collection/DBConfig.class.php";
require_once "classes/data-collection/Login.class.php";
require_once "classes/data-collection/Session.class.php";
require_once "classes/helper/TimeStamp.class.php";
require_once "classes/dao/DAO.class.php";
require_once "classes/dao/SessionDAO.class.php";


class SessionDAOTest extends TestCase {

    private $dbc;
    /* @type DAO
     * @throws Exception
     */

    function setUp() {

        DB::connect(new DBConfig(["type" => "temp", "staticTokens" => true]));
        $this->dbc = new SessionDAO();
        $this->dbc->runFile('scripts/sql-schema/sqlite.sql');
        $this->dbc->runFile('unit-tests/testdata.sql');
    }


    function tearDown() {

        unset($this->dbc);
    }


    function test_getLoginSession() {

        $result = $this->dbc->getLoginSession('nice_token');
        $expected = new Session('nice_token', 'sample_group/test', ['codeRequired']);

        $this->assertEquals($result, $expected);

        try {

            $this->dbc->getLogin('expired_token');
            $this->fail("Exception expected");

        } catch (HttpError $exception) {

            $this->assertEquals($exception->getCode(), 410);
        }

        try {

            $this->dbc->getLogin('not_existing_token');
            $this->fail("Exception expected");

        } catch (HttpError $exception) {

            $this->assertEquals($exception->getCode(), 403);
        }
    }



    function test_createPerson() {

        $login = new Login(
            1,
            "some_user",
            "token",
            "some_mode",
            "a group name",
            ["existing_code" => ["a booklet"]],
            1,
            TimeStamp::fromXMLFormat('1/1/2030 12:00')
        );
        $result = $this->dbc->createPerson($login, 'existing_code');
        $expect = [
            'id' => 1,
            'token' => 'static_token:person:a group name_some_user_existing_code',
            'login_id' => 1,
            'code' => 'existing_code',
            'validTo' => 1893495600,
            'laststate' => null
        ];
        $this->assertEquals($result, $expect);

        try {

            $this->dbc->createPerson($login, 'wrong_code');
            $this->fail("Exception expected");

        } catch (HttpError $exception) {

            $this->assertEquals($exception->getCode(), 400);
        }

    }
}
