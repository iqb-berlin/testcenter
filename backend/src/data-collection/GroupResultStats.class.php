<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
readonly class GroupResultStats {
  public string $host;
  public string $groupName;
  public string $groupLabel;
  public int $bookletsStarted;
  public int $numUnitsMin;
  public int $numUnitsMax;
  public int $numUnitsTotal;
  public float $numUnitsAvg;
  public int $lastChange;


  public function __construct(
    string $host,
    string $groupName,
    string $groupLabel,
    int $bookletsStarted,
    int $numUnitsMin,
    int $numUnitsMax,
    int $numUnitsTotal,
    float $numUnitsAvg,
    int $lastChange,
  ) {
    $this->host = $host;
    $this->groupName = $groupName;
    $this->groupLabel = $groupLabel;
    $this->bookletsStarted = $bookletsStarted;
    $this->numUnitsMin = $numUnitsMin;
    $this->numUnitsMax = $numUnitsMax;
    $this->numUnitsTotal = $numUnitsTotal;
    $this->numUnitsAvg = $numUnitsAvg;
    $this->lastChange = $lastChange;
  }
}