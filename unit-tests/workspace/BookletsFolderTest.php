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


    function test_assemblePreparedBookletsFromFiles() {

        $result = $this->bookletsFolder->assemblePreparedBookletsFromFiles();

        $this->assertArrayHasKey('sample_group', $result);
        $this->assertEquals('sample_group', $result['sample_group']['groupname']);
        $this->assertEquals(1, $result['sample_group']['loginsPrepared']);
        $this->assertEquals(2, $result['sample_group']['personsPrepared']);
        $this->assertEquals(4, $result['sample_group']['bookletsPrepared']);
        $this->assertArrayHasKey('bookletsStarted', $result['sample_group']);
        $this->assertArrayHasKey('bookletsLocked', $result['sample_group']);
        $this->assertArrayHasKey('laststart', $result['sample_group']);
        $this->assertArrayHasKey('laststartStr', $result['sample_group']);
    }


    function test_getBookletName() {

        $result = $this->bookletsFolder->getBookletLabel('BOOKLET.SAMPLE');
        $expectation = 'Sample booklet';
        $this->assertEquals($expectation, $result);

        $this->expectException('HttpError');
        $this->bookletsFolder->getBookletLabel('inexistent.BOOKLET');
    }
}
