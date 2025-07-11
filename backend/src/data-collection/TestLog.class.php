<?php
declare(strict_types=1);

class TestLog extends DataCollectionTypeSafe {
  function __construct(
    public readonly int $testId,
    public readonly string $logKey,
    public readonly int $timestamp,
    public readonly string $logContent = ''
  ) {
  }
}

