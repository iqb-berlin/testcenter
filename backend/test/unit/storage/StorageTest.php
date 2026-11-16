<?php
declare(strict_types=1);

use org\bovigo\vfs\vfsStream;
use PHPUnit\Framework\TestCase;

// the storage of the unit tests, as the bootstrap configures it: the filesystem driver below `vfs://root`
class StorageTest extends TestCase {
  function test_checkWriteAccess_leavesNoFileBehind(): void {
    $root = vfsStream::setup('root');
    $data = vfsStream::newDirectory('data')->at($root);

    Storage::checkWriteAccess();

    $this->assertFalse($data->hasChildren());
  }

  function test_checkWriteAccess_failsNamingTheStorage(): void {
    $root = vfsStream::setup('root');
    vfsStream::newDirectory('data', 0555)->at($root);

    $this->expectExceptionMessage('Storage (filesystem below `vfs://root`) is not writable');

    Storage::checkWriteAccess();
  }
}
