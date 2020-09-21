<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/workspace/Workspace.class.php";
require_once "classes/workspace/TesttakersFolder.class.php";
require_once "VfsForTest.class.php";


class TesttakersFolderTest extends TestCase {

    private $vfs;
    private $folder;

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        $this->vfs = VfsForTest::setUp();
        $this->folder = new TesttakersFolder(1);
    }


    function test_searchAllForLogin()
    {

        $result = $this->folder::searchAllForLogin('unit_test_login', 'unit_test_password');
        $expected = new PotentialLogin(
            'unit_test_login',
            'run-hot-return',
            'sample_group',
            [
                "abc" => [
                    "BOOKLET.SAMPLE",
                    "BOOKLET.SAMPLE-2"
                ],
                "def" => [
                    "BOOKLET.SAMPLE",
                    "BOOKLET.SAMPLE-2"
                ]
            ],
            1,
            0,
            1583053200,
            45,
            (object)['somestr' => 'string']
        );
        $this->assertEquals($expected, $result, "login with password");
    }


    function test_findLoginData() {

        $result = $this->folder->findLoginData('unit_test_login', 'unit_test_password');
        $expected = new PotentialLogin(
            'unit_test_login',
            'run-hot-return',
            'sample_group',
            [
                "abc" => [
                    "BOOKLET.SAMPLE",
                    "BOOKLET.SAMPLE-2"
                ],
                "def" => [
                    "BOOKLET.SAMPLE",
                    "BOOKLET.SAMPLE-2"
                ]
            ],
            1,
            0,
            1583053200,
            45,
            (object) ['somestr' => 'string']
        );
        $this->assertEquals($expected, $result, "login with password");

        $result = $this->folder->findLoginData('unit_test_login-no-pw', '');
        $expected = new PotentialLogin(
            'unit_test_login-no-pw',
            'run-hot-restart',
            'passwordless_group',
            ['' => ['BOOKLET.SAMPLE']],
            1,
            0,
            0,
            0,
            (object) ['somestr' => 'string']
        );
        $this->assertEquals($expected, $result, "login without password (attribute omitted)");


        $result = $this->folder->findLoginData('unit_test_login-no-pw-trial', '');
        $expected = new PotentialLogin(
            'unit_test_login-no-pw-trial',
            'run-trial',
            'passwordless_group',
            ['' => ['BOOKLET.SAMPLE']],
            1,
            0,
            0,
            0,
            (object) ['somestr' => 'string']
        );
        $this->assertEquals($expected, $result, "login without password (attribute empty)");


        $result = $this->folder->findLoginData('unit_test_login-group-monitor', 'unit_test_password');
        $expected = new PotentialLogin(
            'unit_test_login-group-monitor',
            'monitor-group',
            'sample_group',
            ['' => []],
            1,
            0,
            1583053200,
            45,
            (object) ['somestr' => 'string']
        );

        $this->assertEquals($expected, $result, "login without booklets");


        $result = $this->folder->findLoginData('unit_test_login', 'wrong password');
        $this->assertNull($result, "login with wrong password");


        $result = $this->folder->findLoginData('wrong username', '__TEST_LOGIN_PASSWORD__');
        $this->assertNull($result, "login with wrong username");


        $result = $this->folder->findLoginData('unit_test_login-no-pw', 'some password');
        $this->assertNull($result, "login with password if none is required (attribute omitted)");


        $result = $this->folder->findLoginData('unit_test_login-no-pw-trial', 'some password');
        $this->assertNull($result, "login with password if none is required (attribute empty)");
    }


    function test_findGroup() {

        $result = $this->folder->findGroup('sample_group');
        $expected = new Group("sample_group", "Primary Sample Group");
        $this->assertEquals($expected, $result);

        $result = $this->folder->findGroup('not_existing_group');
        $this->assertNull($result);
    }


    function test_getAllGroups() {

        $result = $this->folder->getAllGroups();
        $expected = [
            'vfs://root/vo_data/ws_1/Testtakers/SAMPLE_TESTTAKERS.XML' => [
                'sample_group' => new Group('sample_group', 'Primary Sample Group'),
                'review_group' => new Group('review_group', 'A Group of Reviewers'),
                'trial_group' => new Group('trial_group', 'A Group for Trials and Demos'),
                'passwordless_group' => new Group('passwordless_group', 'A group of persons without password'),
                'expired_group' => new Group('expired_group', 'An already expired group'),
                'future_group' => new Group('future_group', 'An not yet active group')
            ]
        ];
        $this->assertEquals($expected, $result);
    }
}
