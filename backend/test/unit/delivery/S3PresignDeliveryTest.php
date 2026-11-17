<?php
declare(strict_types=1);

use org\bovigo\vfs\vfsStream;
use PHPUnit\Framework\TestCase;

// Presigning is computed locally, so no S3 is needed. The existence check uses the storage of the unit tests, the
// filesystem driver below `vfs://root`.
class S3PresignDeliveryTest extends TestCase {
  private const int INTERVAL = 3600;
  /** 2026-01-01 00:00:00 UTC */
  private const int INTERVAL_START = 1767225600;

  private StoragePath $path;

  function setUp(): void {
    vfsStream::setup('root');
    $this->path = StoragePath::fromString('ws_1/Resource/main.js');
    Storage::getDriver()->putContents($this->path, 'x');
  }

  private static function createConfig(?string $publicEndpoint, int $urlRenewalInterval = self::INTERVAL): S3PresignDeliveryConfig {
    $storage = new S3DriverConfig('http://s3:8333', 'us-east-1', 'testcenter', 'key', 'secret', true);
    return new S3PresignDeliveryConfig($storage, $publicEndpoint, $urlRenewalInterval);
  }

  private static function createDelivery(int $now): S3PresignDelivery {
    $storage = self::createConfig(null)->storage;
    $client = new FixedDatePresignS3Client($storage->createClientConfiguration('https://s3.example.org'));
    return new S3PresignDelivery($client, $storage->bucket, 'data', self::INTERVAL, fn(): int => $now);
  }

  private function deliverAt(int $now): Slim\Http\Response {
    return self::createDelivery($now)->deliver(ResponseCreator::createEmpty(), $this->path);
  }

  /** @return array<string, string> */
  private static function getQuery(string $url): array {
    parse_str(parse_url($url, PHP_URL_QUERY), $query);
    return $query;
  }

  function test_deliver_redirectsToAUrlSignedForTheIntervalStartAndValidForTwoIntervals(): void {
    $response = $this->deliverAt(self::INTERVAL_START + 100);

    $this->assertSame(302, $response->getStatusCode());
    $url = $response->getHeaderLine('Location');
    $this->assertStringStartsWith('https://s3.example.org/testcenter/data/ws_1/Resource/main.js?', $url);
    $query = self::getQuery($url);
    $this->assertSame('20260101T000000Z', $query['X-Amz-Date']);
    $this->assertSame((string) (2 * self::INTERVAL), $query['X-Amz-Expires']);
  }

  function test_deliver_allowsReusingTheRedirectUntilTheIntervalEnds(): void {
    $response = $this->deliverAt(self::INTERVAL_START + 100);

    $this->assertSame('private, max-age=' . (self::INTERVAL - 100), $response->getHeaderLine('Cache-Control'));
  }

  function test_deliver_givesTheSameUrlWithinAnIntervalAndAnotherInTheNext(): void {
    $url = $this->deliverAt(self::INTERVAL_START)->getHeaderLine('Location');

    $this->assertSame($url, $this->deliverAt(self::INTERVAL_START + self::INTERVAL - 1)->getHeaderLine('Location'));
    $this->assertNotSame($url, $this->deliverAt(self::INTERVAL_START + self::INTERVAL)->getHeaderLine('Location'));
  }

  function test_deliver_failsOnMissingFile(): void {
    $this->expectException(HttpError::class);
    $this->expectExceptionCode(404);

    self::createDelivery(self::INTERVAL_START)
      ->deliver(ResponseCreator::createEmpty(), StoragePath::fromString('ws_1/Resource/missing.js'));
  }

  function test_config_signsForThePublicEndpoint(): void {
    $response = self::createConfig('https://s3.example.org')->createMethod('data')
      ->deliver(ResponseCreator::createEmpty(), $this->path);

    $this->assertStringStartsWith('https://s3.example.org/testcenter/data/', $response->getHeaderLine('Location'));
  }

  function test_config_signsForTheStorageEndpointWithoutAPublicOne(): void {
    $response = self::createConfig(null)->createMethod('data')->deliver(ResponseCreator::createEmpty(), $this->path);

    $this->assertStringStartsWith('http://s3:8333/testcenter/data/', $response->getHeaderLine('Location'));
  }

  function test_config_rejectsIntervalsS3CannotSign(): void {
    foreach ([0, S3PresignDeliveryConfig::MAX_URL_RENEWAL_INTERVAL + 1] as $urlRenewalInterval) {
      try {
        self::createConfig(null, $urlRenewalInterval);
        $this->fail("Interval of $urlRenewalInterval seconds accepted.");
      } catch (InvalidArgumentException) {
        $this->addToAssertionCount(1);
      }
    }
    $this->assertSame(
      S3PresignDeliveryConfig::MAX_URL_RENEWAL_INTERVAL,
      self::createConfig(null, S3PresignDeliveryConfig::MAX_URL_RENEWAL_INTERVAL)->urlRenewalInterval
    );
  }

  function test_config_rejectsEmptyPublicEndpoint(): void {
    $this->expectException(InvalidArgumentException::class);

    self::createConfig('');
  }
}
