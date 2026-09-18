<?php
declare(strict_types=1);

use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;

/**
 * S3-compatible driver (MinIO in-cluster first, portable to AWS S3 / StackIT
 * by configuration only). Object keys equal the logical path.
 *
 * Two clients are used: an internal one for PUT/GET/list against the
 * in-cluster endpoint, and a presign client signed against the browser-facing
 * public endpoint (SigV4 signs the host, so presigned URLs must be minted for
 * the endpoint the client will actually call).
 */
class S3Driver implements StorageDriver {

  private S3Client $client;
  private ?S3Client $presignClient = null;
  private string $bucket;

  public function __construct() {
    $this->bucket = SystemConfig::$storage_s3Bucket;
    $this->client = $this->makeClient(SystemConfig::$storage_s3Endpoint);
  }

  private function makeClient(string $endpoint): S3Client {
    $config = [
      'version' => 'latest',
      'region' => SystemConfig::$storage_s3Region,
      'use_path_style_endpoint' => SystemConfig::$storage_s3PathStyle,
      'credentials' => [
        'key' => SystemConfig::$storage_s3AccessKey,
        'secret' => SystemConfig::$storage_s3SecretKey
      ]
    ];
    // Empty endpoint => let the SDK derive the AWS endpoint from the region.
    if ($endpoint !== '') {
      $config['endpoint'] = $endpoint;
    }
    return new S3Client($config);
  }

  private function presigner(): S3Client {
    if ($this->presignClient === null) {
      $public = SystemConfig::$storage_s3PublicEndpoint;
      $this->presignClient = ($public !== '')
        ? $this->makeClient($public)
        : $this->client;
    }
    return $this->presignClient;
  }

  private function key(string $logicalPath): string {
    return ltrim($logicalPath, '/');
  }

  public function put(string $logicalPath, string $localSourcePath): void {
    $this->client->putObject([
      'Bucket' => $this->bucket,
      'Key' => $this->key($logicalPath),
      'SourceFile' => $localSourcePath
    ]);
  }

  public function putContents(string $logicalPath, string $contents): void {
    $this->client->putObject([
      'Bucket' => $this->bucket,
      'Key' => $this->key($logicalPath),
      'Body' => $contents
    ]);
  }

  public function get(string $logicalPath): string {
    $result = $this->client->getObject([
      'Bucket' => $this->bucket,
      'Key' => $this->key($logicalPath)
    ]);
    return (string) $result['Body'];
  }

  public function getStream(string $logicalPath) {
    $result = $this->client->getObject([
      'Bucket' => $this->bucket,
      'Key' => $this->key($logicalPath)
    ]);
    $body = $result['Body'];
    // Detach the underlying PHP stream resource for fpassthru-style download.
    return $body->detach();
  }

  public function exists(string $logicalPath): bool {
    return $this->client->doesObjectExist($this->bucket, $this->key($logicalPath));
  }

  public function delete(string $logicalPath): void {
    $this->client->deleteObject([
      'Bucket' => $this->bucket,
      'Key' => $this->key($logicalPath)
    ]);
  }

  public function copy(string $from, string $to): void {
    $this->client->copyObject([
      'Bucket' => $this->bucket,
      'CopySource' => $this->bucket . '/' . $this->key($from),
      'Key' => $this->key($to)
    ]);
  }

  public function list(string $prefix): array {
    $keys = [];
    $paginator = $this->client->getPaginator('ListObjectsV2', [
      'Bucket' => $this->bucket,
      'Prefix' => $this->key($prefix)
    ]);
    foreach ($paginator as $page) {
      foreach ($page['Contents'] ?? [] as $object) {
        $keys[] = $object['Key'];
      }
    }
    return $keys;
  }

  public function size(string $logicalPath): int {
    try {
      $result = $this->client->headObject([
        'Bucket' => $this->bucket,
        'Key' => $this->key($logicalPath)
      ]);
      return (int) $result['ContentLength'];
    } catch (S3Exception $e) {
      return 0;
    }
  }

  public function mtime(string $logicalPath): int {
    try {
      $result = $this->client->headObject([
        'Bucket' => $this->bucket,
        'Key' => $this->key($logicalPath)
      ]);
      return $result['LastModified'] ? $result['LastModified']->getTimestamp() : 0;
    } catch (S3Exception $e) {
      return 0;
    }
  }

  public function presignGet(string $logicalPath, int $ttlSeconds): string {
    $client = $this->presigner();
    $command = $client->getCommand('GetObject', [
      'Bucket' => $this->bucket,
      'Key' => $this->key($logicalPath)
    ]);
    $request = $client->createPresignedRequest($command, "+$ttlSeconds seconds");
    return (string) $request->getUri();
  }
}
