<?php

declare(strict_types=1);

use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Mockery\MockInterface;
use org\bovigo\vfs\vfsStream;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class AssetControllerTest extends TestCase {
  use MockeryPHPUnitIntegration;

  private AssetDAO|MockInterface $assetDaoMock;

  function setUp(): void {
    require_once "test/unit/test-helper/RequestCreator.class.php";
    require_once "test/unit/test-helper/ResponseCreator.class.php";

    $this->assetDaoMock = Mockery::mock('overload:' . AssetDAO::class);
  }

  function tearDown(): void {
    Mockery::close();
  }

  function test_DeleteMissingAssetShouldThrowHttpError(): void {
    $this->assetDaoMock->allows()->getAsset(7)->andReturn(null);

    try {
      AssetController::delete(
        RequestCreator::create('DELETE', '/assets/7'),
        ResponseCreator::createEmpty(),
        ['id' => '7']
      );
      static::fail('No exception thrown');
    } catch (HttpError $exception) {
      // the central error handler turns this into a uniform response with a body and an Error-ID header
      static::assertEquals(404, $exception->getCode());
      static::assertStringContainsString('7', $exception->getMessage());
    }
  }

  function test_GetFileShouldDeliverTheAssetToEveryCache(): void {
    vfsStream::setup('root');
    Storage::getDriver()->putContents(AssetStorage::getPath('asset_abc.png'), 'image');

    $response = AssetController::getFile(
      RequestCreator::create('GET', '/public/uploaded_assets/asset_abc.png'),
      ResponseCreator::createEmpty(),
      ['name' => 'asset_abc.png']
    );

    static::assertSame('image', (string) $response->getBody());
    static::assertSame('image/png', $response->getHeaderLine('Content-Type'));
    static::assertSame('public, max-age=31536000, immutable', $response->getHeaderLine('Cache-Control'));
  }

  /** @return array<string, array{string}> */
  static function provideUnknownAssetNames(): array {
    return [
      'missing file' => ['asset_missing.png'],
      'not a file name' => ['..']
    ];
  }

  /** @dataProvider provideUnknownAssetNames */
  function test_GetFileOfUnknownAssetShouldThrowHttpError(string $name): void {
    vfsStream::setup('root');

    try {
      AssetController::getFile(
        RequestCreator::create('GET', "/public/uploaded_assets/$name"),
        ResponseCreator::createEmpty(),
        ['name' => $name]
      );
      static::fail('No exception thrown');
    } catch (HttpError $exception) {
      static::assertEquals(404, $exception->getCode());
    }
  }

  function test_UploadWithoutFileShouldThrowHttpError(): void {
    try {
      AssetController::upload(
        RequestCreator::create('POST', '/assets'),
        ResponseCreator::createEmpty()
      );
      static::fail('No exception thrown');
    } catch (HttpError $exception) {
      static::assertEquals(400, $exception->getCode());
    }
  }
}
