<?php

declare(strict_types=1);

use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Mockery\MockInterface;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class AssetAssignmentControllerTest extends TestCase {
  use MockeryPHPUnitIntegration;

  private AssetDAO|MockInterface $assetDaoMock;

  function setUp(): void {
    require_once "test/unit/test-helper/RequestCreator.class.php";
    require_once "test/unit/test-helper/ResponseCreator.class.php";

    $this->assetDaoMock = Mockery::mock('overload:' . AssetDAO::class);
    $this->assetDaoMock->allows()->transactional(Mockery::any())->andReturnUsing(static fn(callable $work) => $work());
  }

  function test_setShouldStoreAndClearSlotsWithTheLastEntryWinning(): void {
    $key = ['scope' => 'global', 'scopeId' => 'global', 'workspaceId' => 0];
    $this->assetDaoMock->expects()->findMissingAssetIds([5])->andReturn([]);
    $this->assetDaoMock->expects()->deleteAssignments([['slotName' => 'logo'] + $key])->once();
    $this->assetDaoMock->expects()->upsertAssignments([['slotName' => 'anything', 'assetId' => 5] + $key])->once();

    AssetAssignmentController::set(
      RequestCreator::create('POST', '/asset-assignments', json_encode(['assignments' => [
        ['slotName' => 'logo', 'assetID' => 4],
        ['slotName' => 'anything', 'assetID' => 5],
        ['slotName' => 'logo', 'assetID' => null]
      ]])),
      ResponseCreator::createEmpty()
    );
  }

  /** @return array<string, array{mixed}> */
  static function provideInvalidBodies(): array {
    return [
      'assignments missing' => [[]],
      'assignments an object' => [['assignments' => ['logo' => 4]]],
      'entry not an object' => [['assignments' => ['logo']]],
      'slotName missing' => [['assignments' => [['assetID' => 4]]]],
      'slotName empty' => [['assignments' => [['slotName' => '', 'assetID' => 4]]]],
      'slotName too long' => [['assignments' => [['slotName' => str_repeat('x', 101), 'assetID' => 4]]]],
      'assetID missing' => [['assignments' => [['slotName' => 'logo']]]],
      'assetID a string' => [['assignments' => [['slotName' => 'logo', 'assetID' => '4']]]],
      'invalid entry after a valid one' => [['assignments' => [['slotName' => 'logo', 'assetID' => 4], ['slotName' => 'x']]]]
    ];
  }

  function test_setShouldRejectUnknownAssetsWithoutWriting(): void {
    $this->assetDaoMock->allows()->findMissingAssetIds([4, 99])->andReturn([99]);
    $this->assetDaoMock->expects()->deleteAssignments(Mockery::any())->never();
    $this->assetDaoMock->expects()->upsertAssignments(Mockery::any())->never();

    $this->expectException(HttpError::class);
    $this->expectExceptionCode(400);
    $this->expectExceptionMessage('99');
    AssetAssignmentController::set(
      RequestCreator::create('POST', '/asset-assignments', json_encode(['assignments' => [
        ['slotName' => 'logo', 'assetID' => null],
        ['slotName' => 'loadingProgress', 'assetID' => 4],
        ['slotName' => 'confirmDialog', 'assetID' => 99]
      ]])),
      ResponseCreator::createEmpty()
    );
  }

  /** @dataProvider provideInvalidBodies */
  function test_setShouldRejectInvalidBodiesWithoutWriting(mixed $body): void {
    $this->assetDaoMock->expects()->deleteAssignments(Mockery::any())->never();
    $this->assetDaoMock->expects()->upsertAssignments(Mockery::any())->never();

    $this->expectException(HttpError::class);
    $this->expectExceptionCode(400);
    AssetAssignmentController::set(
      RequestCreator::create('POST', '/asset-assignments', json_encode($body)),
      ResponseCreator::createEmpty()
    );
  }
}
