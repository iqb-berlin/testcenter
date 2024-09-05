<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Login extends DataCollectionTypeSafe {

  protected $name = "";
  protected $_password = "";
  protected $mode = "";
  protected $groupName = "";
  protected $groupLabel = "";
  protected $booklets = [];
  protected $workspaceId = 0;

  protected $validFrom = 0;
  protected $validTo = 0;
  protected $validForMinutes = 0;

  protected $customTexts;
  protected array $profiles;


  function __construct(
    string $name,
    string $password,
    string $mode,
    string $groupName,
    string $groupLabel,
    array $booklets,
    int $workspaceId,
    ?int $validTo = 0,
    ?int $validFrom = 0,
    ?int $validForMinutes = 0,
    $customTexts = null,
    $profiles = []
  ) {

    $this->name = $name;
    $this->_password = $password;
    $this->mode = $mode;
    $this->groupName = $groupName;
    $this->groupLabel = $groupLabel;
    $this->booklets = $booklets;
    $this->workspaceId = $workspaceId;
    $this->validFrom = $validFrom ?? 0;
    $this->validTo = $validTo ?? 0;
    $this->validForMinutes = $validForMinutes ?? 0;
    $this->customTexts = $customTexts ?? new stdClass();
    $this->profiles = $profiles;
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

  public function getBooklets(): array {
    return $this->booklets;
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
    return (array_keys($this->booklets) != ['']);
  }

  public function getProfiles(): array {
    return $this->profiles;
  }
}
