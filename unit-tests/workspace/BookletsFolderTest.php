<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/workspace/Workspace.class.php";
require_once "classes/workspace/BookletsFolder.class.php";
require_once "VfsForTest.class.php";


class BookletsFolderTest extends TestCase {

    private $vfs;
    private $bookletsFolder;

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        $this->vfs = VfsForTest::setUp();
        $this->bookletsFolder = new BookletsFolder(1);
    }


    function test_getTestStatusOverview() {

        $result = $this->bookletsFolder->getTestStatusOverview(
            [
                [
                    'groupname' => 'sample_group',
                    'loginname' => 'test',
                    'code' => 'abc',
                    'bookletname' => 'BOOKLET.SAMPLE',
                    'locked' => 0,
                    'lastlogin' => '2003-03-33 03:33:33',
                    'laststart' => '2003-03-33 03:33:33'
                ],
                [
                    'groupname' => 'sample_group',
                    'loginname' => 'test',
                    'code' => 'def',
                    'bookletname' => 'BOOKLET.SAMPLE',
                    'locked' => 1,
                    'lastlogin' => '2003-03-33 03:33:33',
                    'laststart' => '2003-03-33 03:33:33'
                ]
            ]
        );

        $this->assertEquals('sample_group', $result[0]['groupname']);
        $this->assertEquals(3, $result[0]['loginsPrepared']); // test login, 2 monitors
        $this->assertEquals(4, $result[0]['personsPrepared']); // two codes for login, 2 monitor accounts
        $this->assertEquals(4, $result[0]['bookletsPrepared']); // two odes on two booklets
        $this->assertEquals(2, $result[0]['bookletsStarted']);
        $this->assertEquals(1, $result[0]['bookletsLocked']);
        $this->assertEquals('future_group', $result[5]['groupname']);
        $this->assertEquals(1, $result[5]['loginsPrepared']);
        $this->assertEquals(1, $result[5]['personsPrepared']);
        $this->assertEquals(1, $result[5]['bookletsPrepared']);
        $this->assertEquals(0, $result[5]['bookletsStarted']);
        $this->assertEquals(0, $result[5]['bookletsLocked']);
    }


    function test_getBookletName() {

        $result = $this->bookletsFolder->getBookletLabel('BOOKLET.SAMPLE');
        $expectation = 'Sample booklet';
        $this->assertEquals($expectation, $result);

        $this->expectException('HttpError');
        $this->bookletsFolder->getBookletLabel('inexistent.BOOKLET');
    }
}
