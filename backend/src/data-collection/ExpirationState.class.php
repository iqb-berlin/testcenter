<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

readonly class ExpirationState {
  public ExpirationStateType $type;
  public ?int $timestamp;
  public function __construct(ExpirationStatetype $type, ?int $timestamp = null) {
    $this->type = $type;
    $this->timestamp = $timestamp;
  }
}