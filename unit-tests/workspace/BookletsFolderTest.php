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
                'sample_group' => [
                    'bookletsStarted' => 2,
                    'bookletsLocked' => 1,
                    'laststart' => strtotime("3/3/2003"),
                    'laststartStr' => '3.3.2003'
                ],
                'orphaned_group' => [
                    'bookletsStarted' => 2,
                    'bookletsLocked' => 0,
                    'laststart' => strtotime("3/3/2003"),
                    'laststartStr' => '3.3.2003'
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
        $this->assertEquals(true, $result[6]['orphaned']);
    }


    function test_getBookletLabel() {

        $result = $this->bookletsFolder->getBookletLabel('BOOKLET.SAMPLE');
        $expectation = 'Sample booklet';
        $this->assertEquals($expectation, $result);

        $this->expectException('HttpError');
        $this->bookletsFolder->getBookletLabel('inexistent.BOOKLET');
    }


    function test_getLogins() {

        $result = $this->bookletsFolder->getLogins();
        $this->assertEquals('unit_test_login', $result->asArray()[0]->getName());
        $this->assertEquals('unit_test_login-group-monitor', $result->asArray()[1]->getName());
        $this->assertEquals('unit_test_login-study-monitor', $result->asArray()[2]->getName());
        $this->assertEquals('unit_test_login-review', $result->asArray()[3]->getName());
        $this->assertEquals('unit_test_login-trial', $result->asArray()[4]->getName());
        $this->assertEquals('unit_test_login-demo', $result->asArray()[5]->getName());
        $this->assertEquals('unit_test_login-no-pw', $result->asArray()[6]->getName());
        $this->assertEquals('unit_test_login-no-pw-trial', $result->asArray()[7]->getName());
        $this->assertEquals('unit_test_login-expired', $result->asArray()[8]->getName());
        $this->assertEquals('expired-group-monitor', $result->asArray()[9]->getName());
        $this->assertEquals('expired-study-monitor', $result->asArray()[10]->getName());
        $this->assertEquals('unit_test_login-future', $result->asArray()[11]->getName());
    }
}
