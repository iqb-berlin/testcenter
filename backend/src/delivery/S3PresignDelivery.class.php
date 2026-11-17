<?php
declare(strict_types=1);

use AsyncAws\S3\Input\GetObjectRequest;
use Slim\Http\Response;

/**
 * Redirects the browser to a presigned URL of the file in the bucket. URLs are renewed in fixed intervals: within one,
 * every request for a file gets the same URL, so the browser can cache the file. A URL stays valid until the end of the
 * following interval, so whoever caches the redirect can still hand it out a while after its interval has ended.
 */
class S3PresignDelivery implements DeliveryMethod {
  private readonly string $rootPrefix;
  private readonly Closure $getCurrentTime;

  /**
   * @param string $root the outermost segment of every stored file's location, the first segment of every key
   * @param ?Closure(): int $getCurrentTime the current Unix time; null for the real one
   */
  function __construct(private readonly FixedDatePresignS3Client $client, private readonly string $bucket,
                       string $root, private readonly int $urlRenewalInterval, ?Closure $getCurrentTime = null) {
    $this->rootPrefix = "$root/";
    // not TimeStamp::now(): in test mode it returns a fixed date in the past, and S3 rejects URLs signed for it as expired
    $this->getCurrentTime = $getCurrentTime ?? time(...);
  }

  public function deliver(Response $response, StoragePath $path): Response {
    if (!Storage::getDriver()->getFileInfo($path)) {
      throw new HttpError("File not found: `$path`", 404);
    }
    $now = ($this->getCurrentTime)();
    $intervalStart = $now - $now % $this->urlRenewalInterval;
    return $response
      ->withStatus(302)
      ->withHeader('Location', $this->createPresignedUrl($path, $intervalStart))
      // signing again before the interval ends gives the same URL, so the redirect may be reused until then
      ->withHeader('Cache-Control', 'private, max-age=' . ($intervalStart + $this->urlRenewalInterval - $now));
  }

  /** The URL of the file for the interval starting at `$intervalStart`, valid until the end of the following one. */
  private function createPresignedUrl(StoragePath $path, int $intervalStart): string {
    $signingDate = new DateTimeImmutable("@$intervalStart");
    return $this->client->presignGetObject(
      new GetObjectRequest(['Bucket' => $this->bucket, 'Key' => $this->rootPrefix . $path]),
      $signingDate,
      $signingDate->modify('+' . (2 * $this->urlRenewalInterval) . ' seconds')
    );
  }
}
