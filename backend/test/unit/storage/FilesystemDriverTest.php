<?php
declare(strict_types=1);

// a real directory, not vfs, so the driver meets the same filesystem as in production
class FilesystemDriverTest extends StorageDriverContractTestCase {
  private string $directory = '';

  protected function createEmptyStorage(): StorageDriver {
    $this->directory = sys_get_temp_dir() . '/' . uniqid('filesystem-driver-test-', true);
    mkdir($this->directory);
    return new FilesystemDriver($this->directory, 'data');
  }

  function tearDown(): void {
    parent::tearDown();
    exec('rm -rf ' . escapeshellarg($this->directory));
  }

  function test_keepsFilesInTheRootBelowTheDirectory(): void {
    $this->driver->putContents(StoragePath::fromString('ws_1/Unit/unit.xml'), 'content');

    $this->assertStringEqualsFile("$this->directory/data/ws_1/Unit/unit.xml", 'content');
  }

  function test_deleteDirectory_removesASymlinkedDirectoryButNotItsTarget(): void {
    $target = "$this->directory-target";
    mkdir($target);
    file_put_contents("$target/index.html", 'x');
    mkdir("$this->directory/data/ws_1", recursive: true);
    symlink($target, "$this->directory/data/ws_1/package");

    $this->driver->deleteDirectory(StorageDirectory::fromString('ws_1/package'));

    $this->assertFileDoesNotExist("$this->directory/data/ws_1/package");
    $this->assertFileExists("$target/index.html");
    exec('rm -rf ' . escapeshellarg($target));
  }
}
