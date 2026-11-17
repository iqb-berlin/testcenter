<?php
declare(strict_types=1);

readonly class S3PresignDeliveryConfig implements DeliveryMethodConfig {
  /** S3 accepts presigned URLs valid for at most a week, and a URL is valid for its interval plus a margin */
  public const int MAX_URL_RENEWAL_INTERVAL = 604800 - S3PresignDelivery::VALIDITY_MARGIN_SECONDS;

  /**
   * @param ?string $publicEndpoint URL of the S3 API as the browser reaches it; null if it is the storage's endpoint
   * @param int $urlRenewalInterval seconds a file keeps the same URL
   */
  function __construct(public S3DriverConfig $storage, public ?string $publicEndpoint, public int $urlRenewalInterval) {
    if ($publicEndpoint === '') {
      throw new InvalidArgumentException('The public S3 endpoint is empty.');
    }
    if ($urlRenewalInterval < 1 or $urlRenewalInterval > self::MAX_URL_RENEWAL_INTERVAL) {
      throw new InvalidArgumentException(
        "The URL renewal interval must be between 1 and " . self::MAX_URL_RENEWAL_INTERVAL . " seconds, not $urlRenewalInterval."
      );
    }
  }

  public function createMethod(string $root): DeliveryMethod {
    // the signature covers the host, so the URL is signed for the endpoint the browser calls
    $endpoint = $this->publicEndpoint ?? $this->storage->endpoint;
    return new S3PresignDelivery(
      new FixedDatePresignS3Client($this->storage->createClientConfiguration($endpoint)),
      $this->storage->bucket,
      $root,
      $this->urlRenewalInterval
    );
  }
}
