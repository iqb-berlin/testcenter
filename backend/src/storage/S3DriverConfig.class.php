<?php
declare(strict_types=1);

use AsyncAws\S3\S3Client;

readonly class S3DriverConfig implements StorageDriverConfig {
  /** @param ?string $endpoint URL of the S3 API; null for AWS, which derives it from the region */
  function __construct(
    public ?string $endpoint,
    public string $region,
    public string $bucket,
    public string $accessKey,
    public string $secretKey,
    public bool $pathStyle
  ) {
    $empty = array_keys(array_filter(
      ['endpoint' => $endpoint, 'region' => $region, 'bucket' => $bucket, 'accessKey' => $accessKey,
        'secretKey' => $secretKey],
      fn(?string $value): bool => $value === ''
    ));
    if ($empty) {
      throw new InvalidArgumentException('S3 storage settings are empty: ' . implode(', ', $empty));
    }
  }

  public function createDriver(string $root): StorageDriver {
    return new S3Driver(new S3Client($this->createClientConfiguration($this->endpoint)), $this->bucket, $root);
  }

  /**
   * @param ?string $endpoint the endpoint the client talks to, which for signed URLs can differ from the backend's
   * @return array<string, string> configuration of an async-aws client
   */
  public function createClientConfiguration(?string $endpoint): array {
    $clientConfig = [
      'region' => $this->region,
      'accessKeyId' => $this->accessKey,
      'accessKeySecret' => $this->secretKey,
      'pathStyleEndpoint' => $this->pathStyle ? 'true' : 'false'
    ];
    if ($endpoint !== null) {
      $clientConfig['endpoint'] = $endpoint;
    }
    return $clientConfig;
  }

  public function describeLocation(): string {
    $location = $this->endpoint !== null ? "at `$this->endpoint`" : "in AWS region `$this->region`";
    return "S3 bucket `$this->bucket` $location";
  }
}
