<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/workspace/WorkspaceController.class.php";
require_once "classes/workspace/TesttakersFolder.class.php";
require_once "VfsForTest.class.php";


class TesttakersFolderTest extends TestCase {

    private $vfs;
    private $folder;

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
        echo "\n!!!!!" . ROOT_DIR;
    }

    function setUp() {

        $this->vfs = VfsForTest::setUp();
        $this->folder = new TesttakersFolder(1);
    }


    function test_searchAllForLogin() {

        $result = $this->folder->findLoginData('test', 'user123');
        $expected = new PotentialLogin(
            'test',
            'run-hot-return',
            'sample_group',
            ['__TEST_PERSON_CODES__' => ['BOOKLET.SAMPLE', 'BOOKLET.SAMPLE-2']], // TODO fix sample file !!!!!
            1,
            0,
            1583053200,
            45,
            (object) ['somestr' => 'string']
        );
        $this->assertEquals($expected, $result, "login with password");


        $result = $this->folder->findLoginData('test-no-pw', '');
        $expected = new PotentialLogin(
            'test-no-pw',
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


        $result = $this->folder->findLoginData('test-no-pw-trial', '');
        $expected = new PotentialLogin(
            'test-no-pw-trial',
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


        $result = $this->folder->findLoginData('test', 'wrong passowrd');
        $this->assertNull($result, "login with wrong password");


        $result = $this->folder->findLoginData('wrong username', 'user123');
        $this->assertNull($result, "login with wrong username");


        $result = $this->folder->findLoginData('test-no-pw', 'some password');
        $this->assertNull($result, "login with password if none is required (attribute omitted)");


        $result = $this->folder->findLoginData('test-no-pw-trial', 'some password');
        $this->assertNull($result, "login with password if none is required (attribute empty)");
    }
}
