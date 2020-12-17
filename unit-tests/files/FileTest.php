<?php

use PHPUnit\Framework\TestCase;

require_once "classes/files/File.php";
require_once "classes/files/XMLFile.php";
require_once "classes/files/XMLFileBooklet.php";
require_once "classes/files/ResourceFile.class.php";
require_once "unit-tests/VfsForTest.class.php";


class FileTest extends TestCase {

    private $vfs;

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        $this->vfs = VfsForTest::setUp();
    }

    function test_get() {

        $file = File::get('Booklet', DATA_DIR . '/Booklet/SAMPLE_BOOKLET.XML');
        $this->assertEquals('XMLFileBooklet', get_class($file));

        $file = File::get('Resource', DATA_DIR . '/Resource/SAMPLE_PLAYER.HTML');
        $this->assertEquals('ResourceFile', get_class($file));
    }

    // most other functions are trivial or tested with specialized classes
}
