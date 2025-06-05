<?php

declare(strict_types=1);

class UnitLog extends DataCollectionTypeSafe
{
  public function __construct(
    public readonly int $testId,
    public readonly string $unitName,
    public readonly string $logKey,
    public readonly int $timestamp,
    public readonly string $logContent = "",
    private string $unitId = '',
    public readonly string $originalUnitId = ''
  ) {
  }

  public function getUnitId(): string {
    return $this->unitId;
  }

  public function setUnitId(string $unitId): void {
    $this->unitId = $unitId;
  }
}