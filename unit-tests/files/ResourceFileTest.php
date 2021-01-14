<?php

use PHPUnit\Framework\TestCase;

require_once "classes/files/File.class.php";
require_once "classes/files/XMLFile.class.php";
require_once "classes/files/XMLFileBooklet.class.php";
require_once "classes/files/ResourceFile.class.php";
require_once "unit-tests/VfsForTest.class.php";


class ResourceFileTest extends TestCase {

    private $vfs;

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        $this->vfs = VfsForTest::setUp();
    }

    function test_getContent() {

        $file = new ResourceFile(DATA_DIR . '/ws_1/Resource/verona-simple-player-1.html');
        $fileContents = file_get_contents(DATA_DIR . '/ws_1/Resource/verona-simple-player-1.html');
        $this->assertEquals($fileContents, $file->getContent());

        $file = new ResourceFile('schmu');
        $this->assertEquals('', $file->getContent());
    }

    // most other functions are trivial or tested with specialized classes
}
