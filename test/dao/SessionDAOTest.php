<?php /** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/exception/HttpError.class.php";
require_once "classes/data-collection/DataCollection.class.php";
require_once "classes/helper/DB.class.php";
require_once "classes/helper/JSON.class.php";
require_once "classes/data-collection/DBConfig.class.php";
require_once "classes/data-collection/LoginSession.class.php";
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
        $this->dbc->runFile('test/testdata.sql');
    }


    function tearDown() {

        unset($this->dbc);
    }


    function test_getSession() {

        $result = $this->dbc->getLogin('nice_token');
        $expected = new LoginSession([
            'id' => '1',
            'name' => 'test',
            'workspaceId' => '1',
            '_validTo' => 1893574800,
            'token' => 'nice_token',
            'mode' => 'run-hot-return',
            'groupName' => 'sample_group',
            'booklets' => [
                'xxx' => [
                    'BOOKLET.SAMPLE'
                ]
            ]
        ]);
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

        $login = new LoginSession([
            "id" => 1,
            "_validTo" => TimeStamp::fromXMLFormat('1/1/2030 12:00'),
            "booklets" => [
                "existing_code" => []
            ]
        ]);
        $result = $this->dbc->createPerson($login, 'existing_code');
        $expect = [
            'id' => 1,
            'token' => 'static_token_person_existing_code',
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

            $this->assertEquals($exception->getCode(), 401);
        }

    }
}
