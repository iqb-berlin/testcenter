<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class AssetDAOTest extends TestCase {
  private AssetDAO $dao;

  function setUp(): void {
    require_once "test/unit/TestDB.class.php";

    TestDB::setUp();
    $this->dao = new AssetDAO();
  }

  function test_findMissingAssetIds(): void {
    $existingId = $this->dao->createAsset('logo.png', 'asset_abc.png');

    static::assertSame([$existingId + 1], $this->dao->findMissingAssetIds([$existingId, $existingId + 1]));
    static::assertSame([], $this->dao->findMissingAssetIds([]));
  }
}
