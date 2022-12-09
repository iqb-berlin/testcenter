<?php

use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;



/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class ResourceFileTest extends TestCase {

    private $fullVerona4MetaData =
    '{
      "$schema": "https://raw.githubusercontent.com/verona-interfaces/metadata/master/verona-module-metadata.json",
      "type": "player",
      "id": "verona-player-awesome",
      "name": [
        {
          "value": "Un Joueur trés Magnifique",
          "lang": "fr"
        },
        {
          "value": "Some Awesome Player",
          "lang": "en"
        }
      ],
      "version": "4.0.0",
      "specVersion": "4.0",
      "description": [
        {
          "value": "Description in English",
          "lang": "en"
        },
        {
          "value": "Beschreibung auf Deutsch",
          "lang": "de"
        }
      ],
      "maintainer": {
        "name": [
          {
            "value": "IQB",
            "lang": "en"
          }
        ],
        "email": "iqb-tbadev@hu-berlin.de",
        "url": "https://www.iqb.hu-berlin.de"
      },
      "code": {
        "repositoryUrl": "https://github.com/iqb-berlin/testcenter-backend",
        "repositoryType": "git",
        "licenseType": "MIT",
        "licenseUrl": "https://raw.githubusercontent.com/iqb-berlin/verona-player-simple/main/LICENSE"
      },
      "notSupportedFeatures": ["log-policy"]
    }';

    public static function setUpBeforeClass(): void {

        require_once "test/unit/VfsForTest.class.php";
        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        require_once "src/data-collection/DataCollectionTypeSafe.class.php";
        require_once "src/data-collection/ValidationReportEntry.class.php";
        require_once "src/data-collection/PlayerMeta.class.php";
        require_once "src/data-collection/FileSpecialInfo.class.php";
        require_once "src/data-collection/FileData.class.php";
        require_once "src/files/File.class.php";
        require_once "src/files/XMLFile.class.php";
        require_once "src/files/XMLFileBooklet.class.php";
        require_once "src/files/ResourceFile.class.php";
        require_once "src/helper/FileName.class.php";
        require_once "src/helper/FileExt.class.php";
        require_once "src/helper/FileTime.class.php";
        require_once "src/helper/Version.class.php";
        require_once "src/helper/JSON.class.php";

        VfsForTest::setUp();
    }


    function test_readPlayerMeta() {

        $playerWithGoodData = $this->createPlayerStubV3(
            'verona-player-very-good-1.0.0.html',
            "A Very Good Player",
            [
                'content' => "verona-player-very-good",
                'data-version' => "1.0.0",
                'data-api-version' => '1.5.0',
            ]
        );

        $expectation =  new FileSpecialInfo();
        $expectation->playerId = 'verona-player-very-good';
        $expectation->label = "A Very Good Player";
        $expectation->veronaVersion = '1.5.0';
        $expectation->version = '1.0.0';

        $this->assertEquals($expectation, $playerWithGoodData->getSpecialInfo());
        $this->assertArrayNotHasKey('error', $playerWithGoodData->getValidationReportSorted());
        $this->assertCount(1, $playerWithGoodData->getValidationReportSorted()['warning']);


        $playerWithNoData = $this->createPlayerStubV3('nometa.html', "Player Without Meta-Information");

        $expectation = new FileSpecialInfo();
        $expectation->label = "Player Without Meta-Information";
        $this->assertEquals($expectation, $playerWithNoData->getSpecialInfo());
        $this->assertArrayNotHasKey('error', $playerWithNoData->getValidationReportSorted());
        $this->assertArrayHasKey('warning', $playerWithNoData->getValidationReportSorted());

        $playerWithVerona4Meta = $this->createPlayerStubV4('verona-player-awesome-4.0.0.html', $this->fullVerona4MetaData);

        $expectation = new FileSpecialInfo();
        $expectation->label = "Some Awesome Player";
        $expectation->description = 'Beschreibung auf Deutsch';
        $expectation->veronaVersion = '4.0';
        $expectation->playerId = 'verona-player-awesome';

        $this->assertEquals($expectation, $playerWithVerona4Meta->getSpecialInfo());
        $this->assertArrayNotHasKey('error', $playerWithVerona4Meta->getValidationReportSorted());
        $this->assertArrayNotHasKey('warning', $playerWithVerona4Meta->getValidationReportSorted());


        $playerWithNoData = $this->createPlayerStubV3('nometa-1.2.3.html', "Player Without Meta-Information");

        $expectation = new FileSpecialInfo();
        $expectation->label = "Player Without Meta-Information";
        $expectation->version = '1.2.3';
        $this->assertEquals($expectation, $playerWithNoData->getSpecialInfo());
        $this->assertArrayNotHasKey('error', $playerWithNoData->getValidationReportSorted());
        $this->assertArrayHasKey('warning', $playerWithNoData->getValidationReportSorted());
    }


    private function createPlayerStubV3(string $fileName, string $title, array $meta = []): ResourceFile {

        $metaTag = '';
        if (count($meta)) {
            $metaTag = '<meta name="application-name"';
            foreach ($meta as $key => $value) {
                $metaTag = "$metaTag $key='$value'";
            }
            $metaTag = "$metaTag />";
        }

        $code = "<html lang='de'><head><title>$title</title>$metaTag</head><body>!</body></html>";
        return $this->resourceFromString($fileName, $code);
    }


    private function createPlayerStubV4(string $fileName, string $meta): ResourceFile {
        $code = "<html lang='de'><head><title>!</title><script type='application/ld+json'>$meta</script></head><body>!</body></html>";
        return $this->resourceFromString($fileName, $code);
    }


    private function resourceFromString(string $fileName, string $content): ResourceFile {

        $path = DATA_DIR . '/ws_1/Resource/' . $fileName;
        file_put_contents($path, $content);
        return new ResourceFile($path);
    }
}
