<?php
declare(strict_types=1);

// a real directory, not vfs, so the driver meets the same filesystem as in production
class FilesystemDriverTest extends StorageDriverContractTestCase {
  private string $root = '';

  protected function createEmptyStorage(): StorageDriver {
    $this->root = sys_get_temp_dir() . '/' . uniqid('filesystem-driver-test-', true);
    mkdir($this->root);
    return new FilesystemDriver($this->root);
  }

  function tearDown(): void {
    parent::tearDown();
    exec('rm -rf ' . escapeshellarg($this->root));
  }

  function test_deleteDirectory_removesASymlinkedDirectoryButNotItsTarget(): void {
    $target = "$this->root-target";
    mkdir($target);
    file_put_contents("$target/index.html", 'x');
    mkdir("$this->root/ws_1");
    symlink($target, "$this->root/ws_1/package");

    $this->driver->deleteDirectory(StorageDirectory::fromString('ws_1/package'));

    $this->assertFileDoesNotExist("$this->root/ws_1/package");
    $this->assertFileExists("$target/index.html");
    exec('rm -rf ' . escapeshellarg($target));
  }
}
