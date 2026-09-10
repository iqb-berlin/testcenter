<?php

declare(strict_types=1);

use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Mockery\MockInterface;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class AssetControllerTest extends TestCase {
  use MockeryPHPUnitIntegration;

  private AssetDAO|MockInterface $assetDaoMock;

  function setUp(): void {
    if (!defined('DATA_DIR')) {
      define('DATA_DIR', ROOT_DIR . '/data');
    }
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
      $this->fail('No exception thrown');
    } catch (HttpError $exception) {
      // the central error handler turns this into a uniform response with a body and an Error-ID header
      $this->assertEquals(404, $exception->getCode());
      $this->assertStringContainsString('7', $exception->getMessage());
    }
  }

  function test_UploadWithoutFileShouldThrowHttpError(): void {
    try {
      AssetController::upload(
        RequestCreator::create('POST', '/assets'),
        ResponseCreator::createEmpty()
      );
      $this->fail('No exception thrown');
    } catch (HttpError $exception) {
      $this->assertEquals(400, $exception->getCode());
    }
  }
}
