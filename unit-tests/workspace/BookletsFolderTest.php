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
            array(
                array(
                    'groupname' => 'sample_group',
                    'loginname' => 'test',
                    'code' => 'abc',
                    'bookletname' => 'BOOKLET.SAMPLE',
                    'locked' => 0,
                    'lastlogin' => '2003-03-33 03:33:33',
                    'laststart' => '2003-03-33 03:33:33'
                ),
                array(
                    'groupname' => 'sample_group',
                    'loginname' => 'test',
                    'code' => 'abc',
                    'bookletname' => 'BOOKLET.SAMPLE',
                    'locked' => 1,
                    'lastlogin' => '2003-03-33 03:33:33',
                    'laststart' => '2003-03-33 03:33:33'
                ),
                array(
                    'groupname' => 'fake_group',
                    'loginname' => 'test',
                    'code' => 'abc',
                    'bookletname' => 'BOOKLET.SAMPLE',
                    'locked' => 1,
                    'lastlogin' => '2003-03-33 03:33:33',
                    'laststart' => '2003-03-33 03:33:33'
                )
            )
        );

        echo "\n ======================================================================";
        print_r($result); // STAND -> die fake group wird nicht mehr verarbeitet
        echo "\n ======================================================================";

        $this->assertEquals('sample_group', $result[0]['groupname']);
        $this->assertEquals(1, $result[0]['loginsPrepared']);
        $this->assertEquals(2, $result[0]['personsPrepared']);
        $this->assertEquals(4, $result[0]['bookletsPrepared']);
        $this->assertEquals(2, $result[0]['bookletsStarted']);
        $this->assertEquals(1, $result[0]['bookletsLocked']);
        $this->assertEquals('fake_group', $result[6]['groupname']);
        $this->assertEquals(0, $result[6]['loginsPrepared']);
        $this->assertEquals(0, $result[6]['personsPrepared']);
        $this->assertEquals(0, $result[6]['bookletsPrepared']);
        $this->assertEquals(1, $result[6]['bookletsStarted']);
        $this->assertEquals(1, $result[6]['bookletsLocked']);

    }


    function test_getBookletName() {

        $result = $this->bookletsFolder->getBookletLabel('BOOKLET.SAMPLE');
        $expectation = 'Sample booklet';
        $this->assertEquals($expectation, $result);

        $this->expectException('HttpError');
        $this->bookletsFolder->getBookletLabel('inexistent.BOOKLET');
    }
}
