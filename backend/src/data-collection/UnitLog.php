<?php

declare(strict_types=1);

class UnitLog extends DataCollectionTypeSafe
{
  public function __construct(
    public readonly int $testId,
    public readonly string $unitName,
    public readonly string $logKey,
    public readonly int $timestamp,
    public readonly string $logContent = '',
  ) {
  }
}