<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

readonly class TestName {
  public string $name;
  function __construct(
    public string $bookletFileId,
    public array $states = []
  ) {
    $s = array_map(
      fn(string $stateKey): string => "$stateKey:{$this->states[$stateKey]}",
      array_keys($this->states)
    );
    $this->name = $this->bookletFileId . (count($s) ? '#' . implode(';', $s) : '');
  }

  function __toString(): string {
    return $this->name;
  }

  static function fromStrings(string $fileId, string $paramString): TestName {
    $params = $paramString ?
      array_reduce(
        explode(';', $paramString),
        function($agg, $paramTuple) {
          list($key, $value) = explode(':', $paramTuple, 2);
          $agg[$key] = $value;
          return $agg;
        },
        []
      ) :
    [];
    return new TestName($fileId, $params);
  }

  static function fromString(string $testName): TestName {
    $testName = preg_replace('/\s/', '', $testName);
    if (!str_contains($testName, '#')) return new TestName($testName);

    list($fileId, $paramString) = explode('#', $testName, 2);
    return TestName::fromStrings($fileId, $paramString);
  }
}
