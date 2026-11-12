<?php
declare(strict_types=1);

use AsyncAws\Core\Exception\Http\ClientException;
use AsyncAws\S3\S3Client;
use Psr\Http\Message\StreamInterface;
use Slim\Psr7\Stream;

/**
 * Keeps each file as an object in a bucket, its key the storage path below the root, e.g. `data/ws_1/Unit/unit.xml`.
 * A directory is a key prefix.
 *
 * The client sends a request only once its result is read or destroyed, so every call here reads or resolves its
 * result: errors surface in the driver call, not somewhere later.
 */
class S3Driver implements StorageDriver {
  /** S3 deletes at most this many objects per request */
  private const int DELETE_BATCH_SIZE = 1000;

  private readonly string $rootPrefix;

  /** @param string $root the outermost segment of every stored file's location, the first segment of every key */
  function __construct(
    private readonly S3Client $client,
    private readonly string $bucket,
    string $root
  ) {
    $this->rootPrefix = "$root/";
  }

  public function put(StoragePath $path, string $localPath): void {
    $handle = @fopen($localPath, 'rb');
    if ($handle === false) {
      throw new Exception("Could not open `$localPath`.");
    }
    try {
      $this->client->putObject(['Bucket' => $this->bucket, 'Key' => $this->getKey($path), 'Body' => $handle])->resolve();
    } finally {
      fclose($handle);
    }
  }

  public function putContents(StoragePath $path, string $contents): void {
    $this->client->putObject(['Bucket' => $this->bucket, 'Key' => $this->getKey($path), 'Body' => $contents])->resolve();
  }

  public function get(StoragePath $path): string {
    return $this->client->getObject(['Bucket' => $this->bucket, 'Key' => $this->getKey($path)])
      ->getBody()
      ->getContentAsString();
  }

  public function getStream(StoragePath $path): StreamInterface {
    $resource = $this->client->getObject(['Bucket' => $this->bucket, 'Key' => $this->getKey($path)])
      ->getBody()
      ->getContentAsResource();
    return new Stream($resource);
  }

  public function getFileInfo(StoragePath $path): ?FileInfo {
    $result = $this->client->headObject(['Bucket' => $this->bucket, 'Key' => $this->getKey($path)]);
    try {
      return new FileInfo($result->getContentLength(), $result->getLastModified()->getTimestamp());
    } catch (ClientException $exception) {
      if ($exception->getResponse()->getStatusCode() === 404) {
        return null;
      }
      throw $exception;
    }
  }

  public function listFiles(StorageDirectory $directory): array {
    $prefix = $this->getPrefix($directory);
    $files = [];
    $result = $this->client->listObjectsV2(['Bucket' => $this->bucket, 'Prefix' => $prefix, 'Delimiter' => '/']);
    foreach ($result->getContents() as $object) {
      $name = substr($object->getKey(), strlen($prefix));
      // a key ending in `/`, as some tools create to show an empty folder, is not a file
      if ($name === '') {
        continue;
      }
      $files[$name] = new FileInfo($object->getSize(), $object->getLastModified()->getTimestamp());
    }
    ksort($files, SORT_STRING);
    return $files;
  }

  public function listSubdirectories(StorageDirectory $directory): array {
    $prefix = $this->getPrefix($directory);
    $names = [];
    $result = $this->client->listObjectsV2(['Bucket' => $this->bucket, 'Prefix' => $prefix, 'Delimiter' => '/']);
    foreach ($result->getCommonPrefixes() as $commonPrefix) {
      $names[] = substr($commonPrefix->getPrefix(), strlen($prefix), -1);
    }
    sort($names, SORT_STRING);
    return $names;
  }

  public function delete(StoragePath $path): void {
    $this->client->deleteObject(['Bucket' => $this->bucket, 'Key' => $this->getKey($path)])->resolve();
  }

  public function deleteDirectory(StorageDirectory $directory): void {
    if ($directory->isRoot()) {
      throw new InvalidArgumentException('Refusing to delete the whole storage.');
    }
    // all keys first: deleting while paging through the same listing could skip objects
    $keys = [];
    $result = $this->client->listObjectsV2(['Bucket' => $this->bucket, 'Prefix' => $this->getPrefix($directory)]);
    foreach ($result->getContents() as $object) {
      $keys[] = $object->getKey();
    }
    foreach (array_chunk($keys, self::DELETE_BATCH_SIZE) as $batch) {
      $this->deleteObjects($batch);
    }
  }

  /** @param string[] $keys */
  private function deleteObjects(array $keys): void {
    $result = $this->client->deleteObjects([
      'Bucket' => $this->bucket,
      'Delete' => [
        'Objects' => array_map(fn(string $key): array => ['Key' => $key], $keys),
        'Quiet' => true
      ]
    ]);
    $errors = $result->getErrors();
    if ($errors) {
      $error = $errors[0];
      throw new Exception(
        sprintf('Could not delete %d objects, e.g. `%s`: %s', count($errors), $error->getKey(), $error->getMessage())
      );
    }
  }

  private function getKey(StoragePath $path): string {
    return $this->rootPrefix . $path;
  }

  private function getPrefix(StorageDirectory $directory): string {
    return $this->rootPrefix . $directory;
  }
}
