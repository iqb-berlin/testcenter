<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/workspace/Workspace.class.php";
require_once "classes/workspace/TesttakersFolder.class.php";
require_once "unit-tests/VfsForTest.class.php";


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


//    function test_searchAllForLogin() {
//
//        $result = $this->folder::searchAllForLogin('test', 'user123');
//        $expected = new PotentialLogin(
//            'test',
//            'run-hot-return',
//            'sample_group',
//            [
//                "xxx" => [
//                    "BOOKLET.SAMPLE-1",
//                    "BOOKLET.SAMPLE-3",
//                    "BOOKLET.SAMPLE-2"
//                ],
//                "yyy" => [
//                    "BOOKLET.SAMPLE-1",
//                    "BOOKLET.SAMPLE-3",
//                    "BOOKLET.SAMPLE-2"
//                ]
//            ],
//            1,
//            0,
//            1583053200,
//            45,
//            (object)['somestr' => 'string']
//        );
//        $this->assertEquals($expected, $result, "login with password");
//    }


//    function test_findLoginData() {
//
//        $result = $this->folder->findLoginData('test', 'user123');
//        $expected = new PotentialLogin(
//            'test',
//            'run-hot-return',
//            'sample_group',
//            [
//                "xxx" => [
//                    "BOOKLET.SAMPLE-1",
//                    'BOOKLET.SAMPLE-3',
//                    'BOOKLET.SAMPLE-2'
//                ],
//                "yyy" => [
//                    "BOOKLET.SAMPLE-1",
//                    'BOOKLET.SAMPLE-3',
//                    'BOOKLET.SAMPLE-2',
//                ]
//            ],
//            1,
//            0,
//            1583053200,
//            45,
//            (object) ['somestr' => 'string']
//        );
//        $this->assertEquals($expected, $result, "login with password");
//
//        $result = $this->folder->findLoginData('test-no-pw', '');
//        $expected = new PotentialLogin(
//            'test-no-pw',
//            'run-hot-restart',
//            'passwordless_group',
//            ['' => ['BOOKLET.SAMPLE-1']],
//            1,
//            0,
//            0,
//            0,
//            (object) ['somestr' => 'string']
//        );
//        $this->assertEquals($expected, $result, "login without password (attribute omitted)");
//
//
//        $result = $this->folder->findLoginData('test-no-pw-trial', '');
//        $expected = new PotentialLogin(
//            'test-no-pw-trial',
//            'run-trial',
//            'passwordless_group',
//            ['' => ['BOOKLET.SAMPLE-1']],
//            1,
//            0,
//            0,
//            0,
//            (object) ['somestr' => 'string']
//        );
//        $this->assertEquals($expected, $result, "login without password (attribute empty)");
//
//
//        $result = $this->folder->findLoginData('test-group-monitor', 'user123');
//        $expected = new PotentialLogin(
//            'test-group-monitor',
//            'monitor-group',
//            'sample_group',
//            ['' => []],
//            1,
//            0,
//            1583053200,
//            45,
//            (object) ['somestr' => 'string']
//        );
//
//        $this->assertEquals($expected, $result, "login without booklets");
//
//
//        $result = $this->folder->findLoginData('test', 'wrong password');
//        $this->assertNull($result, "login with wrong password");
//
//
//        $result = $this->folder->findLoginData('wrong username', 'user123');
//        $this->assertNull($result, "login with wrong username");
//
//
//        $result = $this->folder->findLoginData('test-no-pw', 'some password');
//        $expected = new PotentialLogin(
//            'test-no-pw',
//            'run-hot-restart',
//            'passwordless_group',
//            ['' => ['BOOKLET.SAMPLE-1']],
//            1,
//            0,
//            0,
//            0,
//            (object) ['somestr' => 'string']
//        );
//        $this->assertEquals($expected, $result, "login with password if none is required (attribute omitted)");
//
//
//        $result = $this->folder->findLoginData('test-no-pw-trial', 'some password');
//        $expected = new PotentialLogin(
//            'test-no-pw-trial',
//            'run-trial',
//            'passwordless_group',
//            ['' => ['BOOKLET.SAMPLE-1']],
//            1,
//            0,
//            0,
//            0,
//            (object) ['somestr' => 'string']
//        );
//        $this->assertEquals($expected, $result, "login with password if none is required (attribute empty)");
//    }


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
