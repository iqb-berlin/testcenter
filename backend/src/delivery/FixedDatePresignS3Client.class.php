<?php
declare(strict_types=1);

use AsyncAws\S3\Input\GetObjectRequest;
use AsyncAws\S3\S3Client;

/**
 * An S3 client that presigns with a given signing date, so that signing the same file again gives the same URL.
 * async-aws's `presign()` always signs with the current time; its signers accept a date, which this client passes in
 * through `getSignerFactories()`.
 */
class FixedDatePresignS3Client extends S3Client {
  private ?DateTimeImmutable $signingDate = null;

  function presignGetObject(GetObjectRequest $request, DateTimeImmutable $signingDate, DateTimeImmutable $expires): string {
    $this->signingDate = $signingDate;
    try {
      return $this->presign($request, $expires);
    } finally {
      $this->signingDate = null;
    }
  }

  protected function getSignerFactories(): array {
    return array_map(
      fn(callable $createSigner): Closure => fn(string $service, string $region): FixedDateSigner => new FixedDateSigner(
        $createSigner($service, $region),
        fn(): ?DateTimeImmutable => $this->signingDate
      ),
      parent::getSignerFactories()
    );
  }
}
