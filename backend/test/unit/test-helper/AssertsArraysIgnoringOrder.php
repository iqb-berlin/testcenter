<?php

declare(strict_types=1);

/**
 * Assertion for data whose order is not part of the contract under test.
 *
 * SQL queries without an `order by` clause make no promise about the order of their rows, so tests
 * on their results must not compare order. Everything else stays strict: keys, values and types are
 * still compared exactly.
 */
trait AssertsArraysIgnoringOrder {
  /**
   * Assert that two arrays hold exactly the same keys, values and types, ignoring any ordering.
   *
   * Normalizes recursively, so nesting depth does not matter.
   *
   * @param array<mixed> $expected
   * @param array<mixed> $actual
   * @param string $message optional explanation shown when the assertion fails
   */
  protected function assertSameIgnoringOrder(array $expected, array $actual, string $message = ''): void {
    $this->assertSame(
      self::normalizeArrayOrder($expected),
      self::normalizeArrayOrder($actual),
      $message
    );
  }

  /**
   * Bring an array into a canonical order, recursively, without changing its content.
   *
   * `assertSame()` compares arrays with `===`, which demands the same key-value pairs in the same
   * order - hence both list items and map keys have to be brought into a defined order here.
   *
   * @param array<mixed> $values
   * @return array<mixed> the same keys and values in a canonical order
   */
  private static function normalizeArrayOrder(array $values): array {
    // Normalize the children first: an item's sort key must not depend on that item's own arbitrary
    // internal order, otherwise two equal items could sort into different positions.
    $values = array_map(
      static fn(mixed $value): mixed => is_array($value) ? self::normalizeArrayOrder($value) : $value,
      $values
    );

    // A list's integer keys are meaningless positions, so sort by value and reindex. Items may be
    // arrays, for which `<=>` is not a total order (arrays with differing keys are uncomparable),
    // so compare their serialization instead: a total order that keeps types and duplicates apart.
    if (array_is_list($values)) {
      usort(
        $values,
        static fn(mixed $left, mixed $right): int => serialize($left) <=> serialize($right)
      );
      return $values;
    }

    // A map's keys are data and must stay comparable, but their insertion order is as arbitrary as
    // the row order they were built from - so sort by key, keeping the key-value association.
    ksort($values);
    return $values;
  }
}
