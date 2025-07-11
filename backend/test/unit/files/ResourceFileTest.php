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
          "value": "Un lecteur trés magnifique",
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
        "repositoryUrl": "https://github.com/iqb-berlin/testcenter/tree/master/backend",
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
    VfsForTest::setUp();
  }

  function test_readPlayerMeta(): void {
    $playerWithGoodData = $this->createPlayerStubV3(
      'verona-player-very-good-1.0.html',
      "A Very Good Player",
      [
        'content' => "verona-player-very-good",
        'data-version' => "1.0.0",
        'data-api-version' => '1.5.0',
      ]
    );

    $this->assertEquals('verona-player-very-good', $playerWithGoodData->getVeronaModuleId());
    $this->assertEquals('1.0.0', $playerWithGoodData->getVersion());
    $this->assertEquals('A Very Good Player', $playerWithGoodData->getLabel());
    $this->assertEquals('1.5.0', $playerWithGoodData->getVeronaVersion());
    $this->assertArrayNotHasKey('error', $playerWithGoodData->getValidationReport());
    $this->assertCount(1, $playerWithGoodData->getValidationReport()['warning']);

    $playerWithNoData = $this->createPlayerStubV3('nometa.html', "Player Without Meta-Information");

    $this->assertEquals('nometa', $playerWithNoData->getVeronaModuleId());
    $this->assertEquals('', $playerWithNoData->getVersion());
    $this->assertEquals("Player Without Meta-Information", $playerWithNoData->getLabel());
    $this->assertEquals('', $playerWithNoData->getVeronaVersion());
    $this->assertArrayNotHasKey('error', $playerWithNoData->getValidationReport());
    $this->assertCount(2, $playerWithNoData->getValidationReport()['warning']);

    $playerWithNoData = $this->createPlayerStubV3('nometa-1.2.3.html', "Player Without Meta-Information but version");

    $this->assertEquals('nometa', $playerWithNoData->getVeronaModuleId());
    $this->assertEquals('1.2.3', $playerWithNoData->getVersion());
    $this->assertEquals("Player Without Meta-Information but version", $playerWithNoData->getLabel());
    $this->assertEquals('', $playerWithNoData->getVeronaVersion());
    $this->assertArrayNotHasKey('error', $playerWithNoData->getValidationReport());
    $this->assertCount(3, $playerWithNoData->getValidationReport()['warning']);

    $playerWithVerona4Meta = $this->createPlayerStubV4('verona-player-awesome-4.0.html', $this->fullVerona4MetaData);

    $this->assertEquals('verona-player-awesome', $playerWithVerona4Meta->getVeronaModuleId());
    $this->assertEquals('4.0.0', $playerWithVerona4Meta->getVersion());
    $this->assertEquals('Beschreibung auf Deutsch', $playerWithVerona4Meta->getDescription());
    $this->assertEquals("Some Awesome Player", $playerWithVerona4Meta->getLabel());
    $this->assertEquals('4.0', $playerWithVerona4Meta->getVeronaVersion());
    $this->assertArrayNotHasKey('error', $playerWithVerona4Meta->getValidationReport());
    $this->assertArrayNotHasKey('warning', $playerWithVerona4Meta->getValidationReport());

    // TODO write test for verona3.5 format
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
