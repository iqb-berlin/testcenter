<?php

use PHPUnit\Framework\TestCase;

require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
require_once "classes/data-collection/ValidationReportEntry.class.php";
require_once "classes/files/File.class.php";
require_once "classes/files/XMLFile.class.php";
require_once "classes/files/XMLFileBooklet.class.php";
require_once "classes/files/ResourceFile.class.php";
require_once "classes/helper/FileName.class.php";
require_once "unit-tests/VfsForTest.class.php";


class ResourceFileTest extends TestCase {

    private $vfs;

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        $this->vfs = VfsForTest::setUp();
    }

//    function test_getContent() {
//
//        $file = new ResourceFile(DATA_DIR . '/ws_1/Resource/verona-simple-player-1.html');
//        $fileContents = file_get_contents(DATA_DIR . '/ws_1/Resource/verona-simple-player-1.html');
//        $this->assertEquals($fileContents, $file->getContent());
//
//        $file = new ResourceFile('schmu');
//        $this->assertEquals('', $file->getContent());
//    }


    function test_readPlayerMeta() {

        $playerWithGoodData = $this->createPlayerStub("A Very Good Player", [
            'content' => "very-good-player",
            'data-version' => "1.0.0",
            'data-api-version' => '1.5.0',
        ]);

        $expectation = [
            'label' => "A Very Good Player - 1.0.0",
            'verona-version' => '1.5.0',
            'version' => '1.0.0',
        ];

        $this->assertEquals($expectation, $playerWithGoodData->getSpecialInfo());
        $this->assertArrayNotHasKey('error', $playerWithGoodData->getValidationReportSorted());
        $this->assertArrayNotHasKey('warning', $playerWithGoodData->getValidationReportSorted());


        $playerWithNoData = $this->createPlayerStub("Player Without Meta-Information");

        $expectation = [
            'label' => "Player Without Meta-Information"
        ];
        $this->assertEquals($expectation, $playerWithNoData->getSpecialInfo());
        $this->assertArrayNotHasKey('error', $playerWithNoData->getValidationReportSorted());
        $this->assertArrayHasKey('warning', $playerWithNoData->getValidationReportSorted());
    }


    private function createPlayerStub(string $title, array $meta = []): ResourceFile {

        $metaTag = '';
        if (count($meta)) {
            $metaTag = '<meta name="application-name"';
            foreach ($meta as $key => $value) {
                $metaTag = "$metaTag $key='$value'";
            }
            $metaTag = "$metaTag />";
        }

        $code = "<html lang='de'><head><title>$title</title>$metaTag</head><body>!</body></html>";
        return $this->resourceFromString($code, 'html');
    }


    private function resourceFromString(string $string, string $extension): ResourceFile {

        $path = DATA_DIR . '/ws_1/Resource/' . md5($string) . '.' . $extension;
        file_put_contents($path, $string);
        return new ResourceFile($path);
    }
}
