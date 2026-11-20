<?php
declare(strict_types=1);

use AsyncAws\S3\Input\GetObjectRequest;
use Slim\Http\Response;

/**
 * Redirects the browser to a presigned URL of the file in the bucket. URLs are renewed in fixed intervals: within one,
 * every request for a file gets the same URL, so the browser can cache the file.
 */
class S3PresignDelivery implements DeliveryMethod {
  /** how long a URL stays valid after its interval, for a browser that got it just before the interval ended */
  public const int VALIDITY_MARGIN_SECONDS = 300;

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
    $intervalEnd = $intervalStart + $this->urlRenewalInterval;
    // signing again before the interval ends gives the same URL, so the browser and the file-server's cache may reuse
    // the redirect until then; an absolute time, unlike `max-age`, stays right when a cache hands the redirect out later
    return $response
      ->withStatus(302)
      ->withHeader('Location', $this->createPresignedUrl($path, $intervalStart, $intervalEnd))
      ->withHeader('Cache-Control', 'private')
      ->withHeader('Expires', gmdate('D, d M Y H:i:s', $intervalEnd) . ' GMT');
  }

  private function createPresignedUrl(StoragePath $path, int $intervalStart, int $intervalEnd): string {
    return $this->client->presignGetObject(
      new GetObjectRequest(['Bucket' => $this->bucket, 'Key' => $this->rootPrefix . $path]),
      new DateTimeImmutable("@$intervalStart"),
      new DateTimeImmutable('@' . ($intervalEnd + self::VALIDITY_MARGIN_SECONDS))
    );
  }
}
