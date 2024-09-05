<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class LoginArray implements IteratorAggregate {
  protected array $array = [];

  public function __construct(Login...$logins) {
    $this->array = $logins;
  }

  public function add(Login $login): void {
    $this->array[] = $login;
  }

  public function getIterator(): Iterator {
    return new ArrayIterator($this->array);
  }

  public function asArray(): array {
    return $this->array;
  }
}
