<?php
/** @noinspection PhpUnhandledExceptionInspection */

use PHPUnit\Framework\TestCase;
require_once "classes/workspace/WorkspaceController.class.php";
require_once "classes/workspace/BookletsFolder.class.php";
require_once "VfsForTest.class.php";


class BookletsFolderTest extends TestCase {

    private $vfs;
    private $bookletsFolder;

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
    }

    function setUp() {

        $this->vfs = VfsForTest::setUp();
        $this->bookletsFolder = new BookletsFolder(1);
    }


    function test_assemblePreparedBookletsFromFiles() {

        $result = $this->bookletsFolder->assemblePreparedBookletsFromFiles();

        $this->assertArrayHasKey('sample_group', $result);
        $this->assertEquals('sample_group', $result['sample_group']['groupname']);
        $this->assertEquals(1, $result['sample_group']['loginsPrepared']);
        $this->assertEquals(2, $result['sample_group']['personsPrepared']);
        $this->assertEquals(2, $result['sample_group']['bookletsPrepared']);
        $this->assertArrayHasKey('bookletsStarted', $result['sample_group']);
        $this->assertArrayHasKey('bookletsLocked', $result['sample_group']);
        $this->assertArrayHasKey('laststart', $result['sample_group']);
        $this->assertArrayHasKey('laststartStr', $result['sample_group']);
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

        $this->assertEquals('sample_group', $result[0]['groupname']);
        $this->assertEquals(1, $result[0]['loginsPrepared']);
        $this->assertEquals(2, $result[0]['personsPrepared']);
        $this->assertEquals(2, $result[0]['bookletsPrepared']);
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
