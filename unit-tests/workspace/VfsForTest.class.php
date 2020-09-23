<?php
/** @noinspection PhpUnhandledExceptionInspection */

require_once "classes/data-collection/DataCollection.class.php";
require_once "classes/data-collection/InstallationArguments.class.php";
require_once "classes/workspace/WorkspaceInitializer.class.php";
require_once "classes/workspace/Workspace.class.php";


use org\bovigo\vfs\vfsStream;
use org\bovigo\vfs\vfsStreamDirectory;

class VfsForTest {


    static function setUpBeforeClass(): void {

        ini_set('max_execution_time', 3);

        if (!defined('ROOT_DIR')) {

            define('ROOT_DIR', vfsStream::url('root'));
        }

        if (!defined('DATA_DIR')) {

            define('DATA_DIR', vfsStream::url('root/vo_data'));
        }
    }

    static function setUp(): vfsStreamDirectory {

        $vfs = vfsStream::setup('root', 0777);
        $sampledataDir = vfsStream::newDirectory('sampledata', 0777)->at($vfs);
        vfsStream::copyFromFileSystem(realpath(__DIR__ . '/../../sampledata'), $sampledataDir);
        $definitionsDir = vfsStream::newDirectory('definitions', 0777)->at($vfs);
        vfsStream::copyFromFileSystem(realpath(__DIR__ . '/../../definitions'), $definitionsDir);
        vfsStream::newDirectory('vo_data', 0777)->at($vfs);

        $initializer = new WorkspaceInitializer();
        $initializer->importSampleData(1, new InstallationArguments([
            'user_name' => 'unit_test_user',
            'user_password' => 'unit_test_user_password',
            'workspace' => '1',
            'test_login_name' => 'unit_test_login',
            'test_login_password' => 'unit_test_password',
            'test_person_codes' => 'abc def'
        ]));

        self::insertTrashFiles();

        return $vfs;
    }


    private static function insertTrashFiles() {

        $trashXml = "<Trash><data value='some'>content</data></Trash>";
        file_put_contents(DATA_DIR . '/ws_1/Testtakers/trash.xml', $trashXml);
        file_put_contents(DATA_DIR . '/ws_1/Booklet/trash.xml', $trashXml);
    }

}
