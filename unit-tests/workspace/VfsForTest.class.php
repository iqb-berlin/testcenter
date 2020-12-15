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

    static function setUp(bool $includeBogusMaterial = false): vfsStreamDirectory {

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
        if ($includeBogusMaterial) {
            $initializer->createSubdirectories(DATA_DIR . '/ws_2/Testtakers');
            self::insertBogusFiles();
        }

        return $vfs;
    }


    private static function insertTrashFiles() {

        $trashXml = "<Trash><data value='some'>content</data></Trash>";
        file_put_contents(DATA_DIR . '/ws_1/Testtakers/trash.xml', $trashXml);
        file_put_contents(DATA_DIR . '/ws_1/Booklet/trash.xml', $trashXml);
    }


    private static function insertBogusFiles(): void {

        $bookletFileContents = file_get_contents(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML');
        $testtakersFileContents = file_get_contents(DATA_DIR . '/ws_1/Testtakers/SAMPLE_TESTTAKERS.XML');

        $brokenTestFiles = [
            1 => [
                "testtakers-broken.xml" =>
                    str_replace('<Metadata', '###BREAK###', $testtakersFileContents),
                "testtakers-missing-booklet.xml" =>
                    '<?xml version="1.0" encoding="utf-8"?><Testtakers>'
                    . '<Metadata><Description>Minimal Testtakers example</Description></Metadata>'
                    . '<Group id="a_group" label="A"><Login mode="run-hot-return" name="a_login">'
                    . '<Booklet>BOOKLET.MISSING</Booklet></Login></Group></Testtakers>',
                "booklet-broken.xml" =>
                    str_replace('<Units', '###BREAK###', $bookletFileContents),
                "booklet-duplicate-id-1.xml" =>
                    '<?xml version="1.0" encoding="utf-8"?><Booklet><Metadata><Id>duplicate_booklet_id</Id>'
                    . '<Label>Duplicate Booklet</Label></Metadata>'
                    . '<Units><Unit id="UNIT.SAMPLE" label="l" /></Units></Booklet>',
                "booklet-duplicate-id-2.xml" =>
                    '<?xml version="1.0" encoding="utf-8"?><Booklet><Metadata><Id>duplicate_booklet_id</Id>'
                    . '<Label>Duplicate Booklet</Label></Metadata>'
                    . '<Units><Unit id="UNIT.SAMPLE" label="l" /></Units></Booklet>',
                "unit-unused-and-missing-ref.xml" =>
                    '<?xml version="1.0" encoding="utf-8"?><Unit><Metadata><Id>unit_unused_and_missing_ref</Id>'
                    . '<Label>Unit with missing DefintionRef</Label></Metadata>'
                    . '<DefinitionRef player="SAMPLE_PLAYER">not-existing.voud</DefinitionRef></Unit>',
                "unit-unused-and-missing-player.xml" =>
                    '<?xml version="1.0" encoding="utf-8"?><Unit><Metadata><Id>unit_unused_and_missing_player</Id>'
                    . '<Label>Unit with missing player</Label></Metadata>'
                    . '<Definition player="missing-player">{}</Definition></Unit>',
                "resource-unused.voud" =>
                    '{}',
                "testtakers-duplicate-login-name.xml" =>
                    '<?xml version="1.0" encoding="utf-8"?><Testtakers>'
                    . '<Metadata><Description>Teststakers with duplicate login in same file</Description></Metadata>'
                    . '<Group id="some_group" label="A">'
                    . '<Login mode="monitor-group" name="duplicate_login" pw="13245678"></Login>'
                    . '<Login mode="monitor-group" name="duplicate_login" pw="13245678"></Login>'
                    . '</Group></Testtakers>',
                "testtakers-duplicate-login-name-cross-file-1.xml" =>
                    '<?xml version="1.0" encoding="utf-8"?><Testtakers>'
                    . '<Metadata><Description>Teststakers with id which is used on other file in same ws (1/2)</Description></Metadata>'
                    . '<Group id="double_group" label="A"><Login mode="monitor-group" name="double_login" pw="13245678">'
                    . '</Login></Group></Testtakers>',
                "testtakers-duplicate-login-name-cross-file-2.xml" =>
                    '<?xml version="1.0" encoding="utf-8"?><Testtakers>'
                    . '<Metadata><Description>Teststakers with id which is used on other file in same ws (2/2)</Description></Metadata>'
                    . '<Group id="double_group_1" label="A"><Login mode="monitor-group" name="double_login" pw="13245678">'
                    . '</Login></Group></Testtakers>',
                "testtakers-duplicate-login-name-cross-ws.xml" =>
                    '<?xml version="1.0" encoding="utf-8"?><Testtakers>'
                    . '<Metadata><Description>Teststakers with id which is used on other ws</Description></Metadata>'
                    . '<Group id="another_group" label="A"><Login mode="monitor-group" name="another_login" pw="13245678">'
                    . '</Login></Group></Testtakers>'
                ],
            2 => [
                "testtakers-duplicate-login-name-cross-ws.xml" =>
                    '<?xml version="1.0" encoding="utf-8"?><Testtakers>'
                    . '<Metadata><Description>Teststakers with id which is used on other ws</Description></Metadata>'
                    . '<Group id="another_group" label="A"><Login mode="monitor-group" name="another_login" pw="13245678">'
                    . '</Login></Group></Testtakers>'
            ]
        ];

        foreach ($brokenTestFiles as $wsId => $brokenTestFilesWS) {

            foreach ($brokenTestFilesWS as $fileName => $fileContents) {

                $type = ucfirst(explode('-', $fileName)[0]);
                //echo "\n-----[$type: $fileName]-----\n$fileContents\n------------\n";
                file_put_contents(DATA_DIR . "/ws_$wsId/$type/$fileName", $fileContents);
            }
        }
    }

}
