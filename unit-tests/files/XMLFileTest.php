<?php

use PHPUnit\Framework\TestCase;

require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
require_once "classes/files/File.class.php";
require_once "classes/files/XMLFile.class.php";


class XMLFileTest extends TestCase {

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
        VfsForTest::setUp(true);
    }


    function test_loadFromFile() {
        $xf = new XMLFile(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML');

        $this->assertEquals('SAMPLE_BOOKLET.XML', $xf->getName());
        $this->assertEquals('BOOKLET.SAMPLE-1', $xf->getId());
        $this->assertEquals('vfs://root/vo_data/ws_1/Booklet/SAMPLE_BOOKLET.XML', $xf->getPath());
        $this->assertEquals('Sample booklet', $xf->getLabel());
        $this->assertEquals(1405, $xf->getSize());
        $this->assertEquals('Booklet', $xf->getRoottagName());
        $this->assertEquals('This a sample booklet for testing/development/showcase purposes.', $xf->getDescription());
        $this->assertEquals('', $xf->getErrorString());
    }


    function test_loadFromNotExisting() {
        $xf = new XMLFile(DATA_DIR . '/ws_1/Booklet/not-existing.XML');

        $this->assertEquals('', $xf->getName());
        $this->assertEquals('', $xf->getId());
        $this->assertEquals('vfs://root/vo_data/ws_1/Booklet/not-existing.XML', $xf->getPath());
        $this->assertEquals('', $xf->getLabel());
        $this->assertEquals(0, $xf->getSize());
        $this->assertEquals('', $xf->getRoottagName());
        $this->assertEquals('', $xf->getDescription());
        $this->assertEquals('[error] file does not exist `vfs://root/vo_data/ws_1/Booklet/not-existing.XML`',
            $xf->getErrorString());
    }


    function test_loadFromArbitrary() {

        file_put_contents(DATA_DIR . "/ws_1/arbitrary.xml", '<a><Metadata><Id>ARBITRARY.XML</Id></Metadata><b>c</b>d</a>');

        $xf = new XMLFile(DATA_DIR . '/ws_1/arbitrary.xml');

        $this->assertEquals('arbitrary.xml', $xf->getName());
        $this->assertEquals('ARBITRARY.XML', $xf->getId());
        $this->assertEquals('vfs://root/vo_data/ws_1/arbitrary.xml', $xf->getPath());
        $this->assertEquals('', $xf->getLabel());
        $this->assertEquals(59, $xf->getSize());
        $this->assertEquals('a', $xf->getRoottagName());
        $this->assertEquals('', $xf->getDescription());
        $this->assertEquals('[error] Invalid root-tag: `a`', $xf->getErrorString());
    }


    function test_loadFromBogus() {

        $xf = new XMLFile(DATA_DIR . '/ws_1/Testtakers/testtakers-broken.xml');

        $this->assertEquals('testtakers-broken.xml', $xf->getName());
        $this->assertEquals('TESTTAKERS-BROKEN.XML', $xf->getId());
        $this->assertEquals('vfs://root/vo_data/ws_1/Testtakers/testtakers-broken.xml', $xf->getPath());
        $this->assertEquals('', $xf->getLabel());
        $this->assertEquals(2183, $xf->getSize());
        $this->assertEquals('', $xf->getRoottagName());
        $this->assertEquals('', $xf->getDescription());
        $this->assertEquals('[error] Error [76] in line 6: Opening and ending tag mismatch: Testtakers line 2 and Metadata, [error] Error [5] in line 8: Extra content at the end of the document', $xf->getErrorString());
    }


    function test_loadFromValid() {

        $xf = new XMLFile(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML', true);

        $this->assertEquals('SAMPLE_BOOKLET.XML', $xf->getName());
        $this->assertEquals('BOOKLET.SAMPLE-1', $xf->getId());
        $this->assertEquals('vfs://root/vo_data/ws_1/Booklet/SAMPLE_BOOKLET.XML', $xf->getPath());
        $this->assertEquals('Sample booklet', $xf->getLabel());
        $this->assertEquals(1405, $xf->getSize());
        $this->assertEquals('Booklet', $xf->getRoottagName());
        $this->assertEquals('This a sample booklet for testing/development/showcase purposes.', $xf->getDescription());
        $this->assertEquals('', $xf->getErrorString());
    }


    function test_loadFromBogusAndValidate() {

        $xf = new XMLFile(DATA_DIR . '/ws_1/Testtakers/testtakers-broken.xml', true);

        $this->assertEquals('testtakers-broken.xml', $xf->getName());
        $this->assertEquals('TESTTAKERS-BROKEN.XML', $xf->getId());
        $this->assertEquals('vfs://root/vo_data/ws_1/Testtakers/testtakers-broken.xml', $xf->getPath());
        $this->assertEquals('', $xf->getLabel());
        $this->assertEquals(2183, $xf->getSize());
        $this->assertEquals('', $xf->getRoottagName());
        $this->assertEquals('', $xf->getDescription());
        $this->assertEquals('[error] Error [76] in line 6: Opening and ending tag mismatch: Testtakers line 2 and Metadata, [error] Error [5] in line 8: Extra content at the end of the document', $xf->getErrorString());
    }


    function test_loadFromInvalid() {

        file_put_contents(DATA_DIR . "/ws_1/invalid.xml", '<Booklet><Metadata><Id>c</Id><Label>d</Label></Metadata><Invalid></Invalid></Booklet>');
        $xf = new XMLFile(DATA_DIR . '/ws_1/invalid.xml', true);

        $this->assertEquals('invalid.xml', $xf->getName());
        $this->assertEquals('C', $xf->getId());
        $this->assertEquals('vfs://root/vo_data/ws_1/invalid.xml', $xf->getPath());
        $this->assertEquals('d', $xf->getLabel());
        $this->assertEquals(85, $xf->getSize());
        $this->assertEquals('Booklet', $xf->getRoottagName());
        $this->assertEquals('', $xf->getDescription());
        $this->assertEquals("[error] Error [1871] in line 1: Element 'Invalid': This element is not expected. Expected is one of ( BookletConfig, Units ).", $xf->getErrorString());
    }
}
