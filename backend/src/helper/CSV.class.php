<?php
declare(strict_types=1);

/**
 * Builds the CSV files the testcenter exports, in the dialect MS Excel reads: semicolon-delimited, UTF-8 with BOM.
 *
 * Every cell is enclosed in double quotes and contained double quotes are doubled (RFC 4180), so delimiters,
 * quotes and line breaks inside a value can neither add columns nor rows. `null` is written as an empty,
 * unenclosed cell.
 */
class CSV {
  public const string BOM = "\xEF\xBB\xBF";
  public const string DELIMITER = ';';
  public const string ENCLOSURE = '"';
  public const string LINE_ENDING = "\n";

  /**
   * example:
   * $data = [
   *  [
   *      "color" => "green",
   *      "form" => "circle"
   *  ],
   *  [
   *      "color" => "blue",
   *      "pattern" => "dotted"
   *  ]
   * ]
   * echo CSV::build($data);
   * "color";"form";"pattern"
   * "green";"circle";
   * "blue";;"dotted"
   *
   * @param array $data - array of (assoc) arrays. keys are columns names, values are cell values
   * @param array $columnNames - names of columns to be written. if empty, all keys of the provided arrays are taken
   */
  static function build(array $data, array $columnNames = []): string {
    $columns = count($columnNames) ? $columnNames : self::collectColumnNamesFromHeterogeneousObjects($data);

    $rows = [self::row($columns)];
    foreach ($data as $set) {
      $rows[] = self::row(array_map(fn($column) => $set[$column] ?? null, $columns));
    }

    return implode(self::LINE_ENDING, $rows);
  }

  /**
   * @param array<string|int|float|bool|null> $cells
   */
  static function row(array $cells): string {
    return implode(self::DELIMITER, array_map([self::class, 'cell'], $cells));
  }

  static function cell(string|int|float|bool|null $value): string {
    if ($value === null) {
      return '';
    }
    $escaped = str_replace(self::ENCLOSURE, self::ENCLOSURE . self::ENCLOSURE, (string) $value);
    return self::ENCLOSURE . $escaped . self::ENCLOSURE;
  }

  /**
   * @param array $data - an array of assoc arrays
   * @return array - all used keys once
   */
  static function collectColumnNamesFromHeterogeneousObjects(array $data): array {
    return array_values(array_unique(array_reduce($data, function($agg, $array) {
      return array_merge($agg, array_keys($array));
    }, [])));
  }
}
