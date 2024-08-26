<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO make class readonly and remove getters

class Login extends DataCollectionTypeSafe {
  protected object $customTexts;
  protected int $validForMinutes;
  /** @param string[][] $testNames */
  function __construct(
    protected string $name,
    protected string $_password,
    protected string $mode,
    protected string $groupName,
    protected string $groupLabel,
    protected array $testNames,
    protected int $workspaceId = 0,
    protected int $validTo = 0,
    protected int $validFrom = 0,
    int | null $validForMinutes = 0,
    object | null $customTexts = null
  ) {
    $this->validForMinutes = $validForMinutes ?? 0;
    $this->customTexts = $customTexts ?? new stdClass();
  }


  public function getName(): string {
    return $this->name;
  }


  public function getPassword(): string {
    return $this->_password;
  }


  public function getMode(): string {
    return $this->mode;
  }


  public function getGroupName(): string {
    return $this->groupName;
  }


  public function getGroupLabel(): string {
    return $this->groupLabel;
  }


  /** @return string[][] */
  public function testNames(): array {
    return $this->testNames;
  }

  public function getWorkspaceId(): int {
    return $this->workspaceId;
  }


  public function getValidFrom(): int {
    return $this->validFrom;
  }


  public function getValidTo(): int {
    return $this->validTo;
  }

  public function getValidForMinutes(): int {
    return $this->validForMinutes;
  }


  public function getCustomTexts(): ?stdClass {
    return $this->customTexts;
  }


  public function isCodeRequired(): bool {
    return (array_keys($this->testNames) != ['']);
  }
}
