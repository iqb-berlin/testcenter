<?php

declare(strict_types=1);

class TestSession extends DataCollectionTypeSafe{
  public string $loginName;
  public string $groupName;
  public string $groupLabel;
  public string $code;
  public string $nameSuffix;
  public string $bookletName;
  public string $bookletLabel;

  public function __construct(
    string $loginName,
    string $groupName,
    string $groupLabel,
    string $code,
    string $nameSuffix,
    string $bookletName,
    string $bookletLabel
  ) {
    $this->loginName = $loginName;
    $this->groupName = $groupName;
    $this->groupLabel = $groupLabel;
    $this->code = $code;
    $this->nameSuffix = $nameSuffix;
    $this->bookletName = $bookletName;
    $this->bookletLabel = $bookletLabel;
  }
}
