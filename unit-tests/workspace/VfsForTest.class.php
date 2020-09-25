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
            "booklet-broken.xml" =>
                str_replace('<Units', '###BREAK###', $bookletFileContents),
            "booklet-duplicate-id.xml" =>
                '<?xml version="1.0" encoding="utf-8"?><Booklet><Metadata><Id>BOOKLET.SAMPLE</Id><Label>Duplicate Booklet</Label></Metadata>'
                . '<Units><Unit id="UNIT.SAMPLE" label="l" /></Units></Booklet>',
            "testtakers-broken.xml" =>
                str_replace('<Metadata', '###BREAK###', $testtakersFileContents),
            "testtakers-duplicate-login-name.xml" =>
                preg_replace('/name="\S+?"/m', 'name="the-same-name"', $testtakersFileContents),
            "testtakers-missing-booklet.xml" =>
                '<?xml version="1.0" encoding="utf-8"?><Testtakers>'
                . '<Metadata><Description>Minimal Testtakers example</Description></Metadata>'
                . '<Group id="a_group" label="A"><Login mode="run-hot-return" name="a_login">'
                . '<Booklet>BOOKLET.MISSING</Booklet></Login></Group></Testtakers>',
            "resource-unused.voud" =>
                '{}',
            "unit-unused-and-missing-player.xml" =>
                '<?xml version="1.0" encoding="utf-8"?><Unit><Metadata><Id>unused</Id><Label>unused</Label></Metadata>'
                . '<Definition player="not-existing">{}</Definition></Unit>',
            "unit-unused-and-missing-ref.xml" =>
                '<?xml version="1.0" encoding="utf-8"?><Unit><Metadata><Id>unused-and-missing</Id><Label>unused</Label></Metadata>'
                . '<DefinitionRef player="SAMPLE_PLAYER">not-existing.voud</DefinitionRef></Unit>',
            "booklet-unused.xml" =>
                '<?xml version="1.0" encoding="utf-8"?><Booklet><Metadata><Id>Unused-Booklet</Id><Label>Minimal Booklet</Label></Metadata>'
                . '<Units><Unit id="UNIT.SAMPLE" label="l" /></Units></Booklet>'
        ];



        foreach ($brokenTestFiles as $fileName => $fileContents) {

            $type = ucfirst(explode('-', $fileName)[0]);
            //echo "\n-----[$type: $fileName]-----\n$fileContents\n------------\n";
            file_put_contents(DATA_DIR . "/ws_1/$type/$fileName", $fileContents);
        }
    }

}
