<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

// Runs against the local S3 of the dev stack (`make test-backend-s3`). The URLs are signed for the storage's endpoint,
// which the tests reach, not for the public one, which only the developer's browser reaches.
class S3PresignDeliveryTest extends TestCase {
  private const int INTERVAL = 3600;

  private static string $root;
  private StoragePath $path;

  // a root of its own, apart from the dev stack's files; set before anything uses the storage, which keeps its root
  static function setUpBeforeClass(): void {
    self::$root = uniqid('s3-presign-delivery-test-', true);
    SystemConfig::$storage_root = self::$root;
  }

  function setUp(): void {
    $this->path = StoragePath::fromString('ws_1/Resource/package/main.js');
    Storage::getDriver()->putContents($this->path, 'export const x = 1;');
  }

  function tearDown(): void {
    Storage::getDriver()->deleteDirectory(StorageDirectory::fromString('ws_1'));
  }

  private static function getStorageConfig(): S3DriverConfig {
    $storage = SystemConfig::$storage_driver;
    if (!$storage instanceof S3DriverConfig) {
      throw new LogicException('The environment configures no S3 storage.');
    }
    return $storage;
  }

  function test_theRedirectDeliversTheFileWithItsContentType(): void {
    $delivery = (new S3PresignDeliveryConfig(self::getStorageConfig(), null, self::INTERVAL))->createMethod(self::$root);

    $response = $delivery->deliver(ResponseCreator::createEmpty(), $this->path);
    $contents = file_get_contents($response->getHeaderLine('Location'));

    $this->assertSame('export const x = 1;', $contents);
    $this->assertContains('Content-Type: text/javascript', $http_response_header);
  }

  function test_theUrlOfThePreviousIntervalIsStillValid(): void {
    $storage = self::getStorageConfig();
    $client = new FixedDatePresignS3Client($storage->createClientConfiguration($storage->endpoint));
    $delivery = new S3PresignDelivery($client, $storage->bucket, self::$root, self::INTERVAL,
                                      fn(): int => time() - self::INTERVAL);

    $response = $delivery->deliver(ResponseCreator::createEmpty(), $this->path);

    $this->assertSame('export const x = 1;', file_get_contents($response->getHeaderLine('Location')));
  }
}
