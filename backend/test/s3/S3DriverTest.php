<?php
declare(strict_types=1);

// Runs against the local S3 of the dev stack (`make test-backend-s3`), with the storage the environment configures for
// the backend. Each test works in a root of its own, apart from other tests and the dev stack's files.
class S3DriverTest extends StorageDriverContractTestCase {
  protected function createEmptyStorage(): StorageDriver {
    $config = SystemConfig::$storage_driver;
    if (!$config instanceof S3DriverConfig) {
      throw new LogicException('The environment configures no S3 storage.');
    }
    return $config->createDriver(uniqid('s3-driver-test-', true));
  }

  function tearDown(): void {
    parent::tearDown();
    foreach ($this->driver->listSubdirectories(StorageDirectory::root()) as $directory) {
      $this->driver->deleteDirectory(StorageDirectory::root()->createSubdirectory($directory));
    }
    foreach (array_keys($this->driver->listFiles(StorageDirectory::root())) as $fileName) {
      $this->driver->delete(StorageDirectory::root()->createFilePath($fileName));
    }
  }

  function test_deleteDirectory_deletesMoreThanOneBatch(): void {
    for ($i = 0; $i < 1001; $i++) {
      $this->driver->putContents(StoragePath::fromString("ws_1/Resource/package/$i.js"), 'x');
    }
    $this->driver->putContents(StoragePath::fromString('ws_1/Unit/unit.xml'), 'x');

    $this->driver->deleteDirectory(StorageDirectory::fromString('ws_1/Resource/package'));

    $this->assertSame([], $this->driver->listFiles(StorageDirectory::fromString('ws_1/Resource/package')));
    $this->assertSame('x', $this->driver->get(StoragePath::fromString('ws_1/Unit/unit.xml')));
  }
}
