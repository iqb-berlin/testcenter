<?php /** @noinspection PhpUnhandledExceptionInspection */


use PHPUnit\Framework\TestCase;
use org\bovigo\vfs\vfsStream;
require_once "admin/classes/workspace/WorkspaceInitializer.class.php";
require_once "admin/classes/workspace/WorkspaceController.class.php";
require_once "vo_code/ResourceFile.class.php";
require_once "vo_code/FileFactory.class.php";
require_once "vo_code/XMLFileTesttakers.php";


class WorkspaceControllerTest extends TestCase {

    private $vfs;
    private $vfsData;
    private $workspaceController;

    public static function setUpBeforeClass(): void {

        ini_set('max_execution_time', 3);
        define('ROOT_DIR', vfsStream::url('root'));
    }

    function setUp() {

        $this->vfs = vfsStream::setup('root', 0777);
        $sampledataDir = vfsStream::newDirectory('sampledata', 0777)->at($this->vfs);
        vfsStream::copyFromFileSystem(realpath(__DIR__ . '/../sampledata'), $sampledataDir);
        $this->vfsData = vfsStream::newDirectory('vo_data', 0777)->at($this->vfs);

        $initializer = new WorkspaceInitializer();
        $initializer->importSampleData(1, array(
            'user_name' => 'unit_test_user',
            'user_password' => 'unit_test_user_password',
            'workspace' => '1',
            'test_login_name' => 'unit_test_login',
            'test_login_password' => 'unit_test_password',
            'test_person_codes' => 'abc def'
        ));

        $this->workspaceController = new WorkspaceController(1);
    }


    function tearDown() {

        unset($this->vfs);
    }


    function listDir($dir, $depth) {

        if ($handle = opendir($dir)) {
            while (false !== ($sub = readdir($handle))) {

                if (in_array($sub, array('.', '..'))) {
                    continue;
                }

                $line = str_repeat('-', $depth);
                $fullPath = ($dir ?  $dir . '/' : '') . $sub;

                if (is_dir($fullPath)) {
                    echo "\n $line [$sub]";
                    $this->listDir($fullPath,  $depth + 1);
                } else {
                    echo "\n $line $sub";
                }

            }
            closedir($handle);
        }

    }

    function test___construct() {

        $workspaceDirectories = scandir($this->vfsData->url());
        $expectation = array('.', '..', 'ws_1');
        $this->assertEquals($expectation, $workspaceDirectories);

        $workspace1Directories = scandir($this->vfsData->url() . '/ws_1');
        $expectation = array('.', '..', 'Booklet', 'Resource', 'SysCheck', 'Testtakers', 'Unit');
        $this->assertEquals($expectation, $workspace1Directories);
    }

    function test_getWorkspacePath() {

        $result = $this->workspaceController->getWorkspacePath();
        $expectation = 'vfs://root/vo_data/ws_1';
        $this->assertEquals($expectation, $result);
    }

    function test_getAllFiles() {

        $result = $this->workspaceController->getAllFiles();
        $this->assertEquals(5, count($result));

        $this->assertEquals('SAMPLE_BOOKLET.XML', $result[0]['filename']);
        $this->assertEquals('Booklet', $result[0]['type']);
        $this->assertArrayHasKey('filesize', $result[0]);
        $this->assertArrayHasKey('filedatetime', $result[0]);

        $this->assertEquals('SAMPLE_TESTTAKERS.XML', $result[1]['filename']);
        $this->assertEquals('Testtakers', $result[1]['type']);
        $this->assertArrayHasKey('filesize', $result[1]);
        $this->assertArrayHasKey('filedatetime', $result[1]);

        $this->assertEquals('SAMPLE_SYSCHECK.XML', $result[2]['filename']);
        $this->assertEquals('SysCheck', $result[2]['type']);
        $this->assertArrayHasKey('filesize', $result[2]);
        $this->assertArrayHasKey('filedatetime', $result[2]);

        $this->assertEquals('SAMPLE_UNIT.XML', $result[3]['filename']);
        $this->assertEquals('Unit', $result[3]['type']);
        $this->assertArrayHasKey('filesize', $result[3]);
        $this->assertArrayHasKey('filedatetime', $result[3]);

        $this->assertEquals('SAMPLE_PLAYER.HTML', $result[4]['filename']);
        $this->assertEquals('Resource', $result[4]['type']);
        $this->assertArrayHasKey('filesize', $result[4]);
        $this->assertArrayHasKey('filedatetime', $result[4]);
    }


    function test_deleteFiles() {

        $this->vfs->getChild('vo_data')->getChild('ws_1')->getChild('SysCheck')->chmod(0000);

        $result = $this->workspaceController->deleteFiles(array(
            'Resource/SAMPLE_PLAYER.HTML',
            'SysCheck/SAMPLE_SYSCHECK.XML',
            'i_dont/even.exist'
        ));

        $resources = scandir('vfs://root/vo_data/ws_1/Resource');
        $expectation = array(
            'deleted' => array('Resource/SAMPLE_PLAYER.HTML'),
            'did_not_exist' => array('i_dont/even.exist'),
            'not_allowed' => array('SysCheck/SAMPLE_SYSCHECK.XML')
        );

        $this->assertEquals($expectation, $result);
        $this->assertEquals($resources, array('.', '..'));
    }


    function test_assemblePreparedBookletsFromFiles() {

        $result = $this->workspaceController->assemblePreparedBookletsFromFiles();

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

        $result = $this->workspaceController->getTestStatusOverview(
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
        $this->assertEquals('fake_group', $result[1]['groupname']);
        $this->assertEquals(0, $result[1]['loginsPrepared']);
        $this->assertEquals(0, $result[1]['personsPrepared']);
        $this->assertEquals(0, $result[1]['bookletsPrepared']);
        $this->assertEquals(1, $result[1]['bookletsStarted']);
        $this->assertEquals(1, $result[0]['bookletsLocked']);

    }

}
