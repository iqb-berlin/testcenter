<?php
declare(strict_types=1);

use AsyncAws\S3\S3Client;

// Runs against the local S3 of the dev stack (`make test-backend-s3`), with the storage the environment configures for
// the backend. Each test works in a root of its own, apart from other tests and the dev stack's files.
class S3DriverTest extends StorageDriverContractTestCase {
  private string $root = '';

  protected function createEmptyStorage(): StorageDriver {
    $this->root = uniqid('s3-driver-test-', true);
    return self::getConfig()->createDriver($this->root);
  }

  private static function getConfig(): S3DriverConfig {
    $config = SystemConfig::$storage_driver;
    if (!$config instanceof S3DriverConfig) {
      throw new LogicException('The environment configures no S3 storage.');
    }
    return $config;
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

  function test_storesTheContentTypeOfTheFileName(): void {
    $localPath = tempnam(sys_get_temp_dir(), 's3-driver-test-');
    file_put_contents($localPath, 'x');
    $this->driver->put(StoragePath::fromString('ws_1/Resource/package/index.HTML'), $localPath);
    unlink($localPath);
    $this->driver->putContents(StoragePath::fromString('ws_1/Resource/package/main.js'), 'x');
    $this->driver->putContents(StoragePath::fromString('ws_1/Resource/package/data.unknown'), 'x');

    $this->assertSame('text/html', $this->getStoredContentType('ws_1/Resource/package/index.HTML'));
    $this->assertSame('text/javascript', $this->getStoredContentType('ws_1/Resource/package/main.js'));
    $this->assertSame('application/octet-stream', $this->getStoredContentType('ws_1/Resource/package/data.unknown'));
  }

  private function getStoredContentType(string $path): ?string {
    $config = self::getConfig();
    return (new S3Client($config->createClientConfiguration($config->endpoint)))
      ->headObject(['Bucket' => $config->bucket, 'Key' => "$this->root/$path"])
      ->getContentType();
  }
}
