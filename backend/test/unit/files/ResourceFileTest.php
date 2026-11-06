<?php
declare(strict_types=1);

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

    static::assertEquals('verona-player-very-good', $playerWithGoodData->getVeronaModuleId());
    static::assertEquals('1.0.0', $playerWithGoodData->getVersion());
    static::assertEquals('A Very Good Player', $playerWithGoodData->getLabel());
    static::assertEquals('1.5.0', $playerWithGoodData->getVeronaVersion());
    static::assertArrayNotHasKey('error', $playerWithGoodData->getValidationReport());
    static::assertCount(1, $playerWithGoodData->getValidationReport()['warning']);

    $playerWithNoData = $this->createPlayerStubV3('nometa.html', "Player Without Meta-Information");

    static::assertEquals('nometa', $playerWithNoData->getVeronaModuleId());
    static::assertEquals('', $playerWithNoData->getVersion());
    static::assertEquals("Player Without Meta-Information", $playerWithNoData->getLabel());
    static::assertEquals('', $playerWithNoData->getVeronaVersion());
    static::assertArrayNotHasKey('error', $playerWithNoData->getValidationReport());
    static::assertCount(2, $playerWithNoData->getValidationReport()['warning']);

    $playerWithNoData = $this->createPlayerStubV3('nometa-1.2.3.html', "Player Without Meta-Information but version");

    static::assertEquals('nometa', $playerWithNoData->getVeronaModuleId());
    static::assertEquals('1.2.3', $playerWithNoData->getVersion());
    static::assertEquals("Player Without Meta-Information but version", $playerWithNoData->getLabel());
    static::assertEquals('', $playerWithNoData->getVeronaVersion());
    static::assertArrayNotHasKey('error', $playerWithNoData->getValidationReport());
    static::assertCount(3, $playerWithNoData->getValidationReport()['warning']);

    $playerWithVerona4Meta = $this->createPlayerStubV4('verona-player-awesome-4.0.html', $this->fullVerona4MetaData);

    static::assertEquals('verona-player-awesome', $playerWithVerona4Meta->getVeronaModuleId());
    static::assertEquals('4.0.0', $playerWithVerona4Meta->getVersion());
    static::assertEquals('Beschreibung auf Deutsch', $playerWithVerona4Meta->getDescription());
    static::assertEquals("Some Awesome Player", $playerWithVerona4Meta->getLabel());
    static::assertEquals('4.0', $playerWithVerona4Meta->getVeronaVersion());
    static::assertArrayNotHasKey('error', $playerWithVerona4Meta->getValidationReport());
    static::assertArrayNotHasKey('warning', $playerWithVerona4Meta->getValidationReport());

    // TODO write test for verona3.5 format
  }

  function test_readMetadataV3(): void {
    $player = $this->createPlayerStubV4('iqb-player-aspect-3.1.html', $this->createMetadataV3([
      'type' => 'PLAYER',
      'id' => 'iqb-player-aspect',
      'version' => '3.1.1',
      'specVersion' => '6.0'
    ]));

    static::assertEquals('iqb-player-aspect', $player->getVeronaModuleId());
    static::assertEquals('3.1.1', $player->getVersion());
    static::assertEquals('player', $player->getVeronaModuleType());
    static::assertEquals('6.0', $player->getVeronaVersion());
    static::assertEquals('Aspect', $player->getLabel());
    static::assertEquals('', $player->getDescription());
    static::assertArrayNotHasKey('error', $player->getValidationReport());
    static::assertArrayNotHasKey('warning', $player->getValidationReport());

    $widget = $this->createPlayerStubV4('periodic-system-select-widget-1.1.html', $this->createMetadataV3([
      '$schema' => 'https://raw.githubusercontent.com/verona-interfaces/verona-module-metadata/85175cbc51a5d40e77b4e6f2ddab944ac0179dd1/verona-module-metadata.schema.json',
      'type' => 'WIDGET',
      'id' => 'periodic-system-select-widget',
      'version' => '1.1.0',
      'specVersion' => '1.0'
    ]));

    static::assertEquals('widget', $widget->getVeronaModuleType());
    static::assertEquals('1.1.0', $widget->getVersion());
    static::assertArrayNotHasKey('warning', $widget->getValidationReport());
  }

  function test_readMetadataV3AcceptsAnyReferenceIntoTheRepository(): void {
    foreach (['refs/heads/master', 'v3.1', '85175cb'] as $reference) {
      $player = $this->createPlayerStubV4('iqb-player-aspect-3.1.html', $this->createMetadataV3([
        '$schema' => "https://raw.githubusercontent.com/verona-interfaces/verona-module-metadata/$reference/verona-module-metadata.schema.json"
      ]));

      static::assertEquals('player', $player->getVeronaModuleType(), $reference);
      static::assertArrayNotHasKey('warning', $player->getValidationReport(), $reference);
    }
  }

  function test_readMetadataV3RejectsUnsupportedFormats(): void {
    $cases = [
      'Unsupported metadata version: `4.0`' => ['metadataVersion' => '4.0'],
      'Could not read metadata: metadataVersion missing' => ['metadataVersion' => null],
      'Wrong metadata-schema: https://example.com/verona-module-metadata.schema.json' =>
        ['$schema' => 'https://example.com/verona-module-metadata.schema.json']
    ];
    foreach ($cases as $expectedWarning => $override) {
      $player = $this->createPlayerStubV4('iqb-player-aspect-3.1.html', $this->createMetadataV3($override));

      static::assertEquals('', $player->getVeronaModuleType(), $expectedWarning);
      static::assertEquals('', $player->getVeronaVersion(), $expectedWarning);
      static::assertContains($expectedWarning, $player->getValidationReport()['warning']);
      static::assertContains('Metadata missing. Version guessed from Filename.', $player->getValidationReport()['warning']);
    }
  }

  /** @param array<string, string|null> $override */
  private function createMetadataV3(array $override = []): string {
    $metadata = array_merge(
      [
        '$schema' => 'https://raw.githubusercontent.com/verona-interfaces/verona-module-metadata/master/verona-module-metadata.schema.json',
        'type' => 'PLAYER',
        'id' => 'iqb-player-aspect',
        'name' => [['lang' => 'de', 'value' => 'Aspect']],
        'version' => '3.1.1',
        'specVersion' => '6.0',
        'metadataVersion' => '3.1'
      ],
      $override
    );
    return json_encode(array_filter($metadata, fn($value) => $value !== null), JSON_THROW_ON_ERROR);
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
