<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Group extends DataCollectionTypeSafe {
  readonly string $label;
  readonly string $name;
  readonly ExpirationState $_expired;

  function __construct(string $name, string $label, ExpirationState $expired = new ExpirationState(ExpirationStateType::None)) {
    $this->label = $label;
    $this->name = $name;
    $this->_expired = $expired;
  }
}
