<?php

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class CSVTest extends TestCase {
  private $_testData = [
    ['a' => 'A', 'b' => 'B'],
    ['a' => 'Ä', 'b' => 'B', 'c' => 'C'],
    ['d' => 'D']
  ];

  function test_collectColumnNamesFromHeterogeneousObjects() {
    $expected = ['a', 'b', 'c', 'd'];
    $actual = CSV::collectColumnNamesFromHeterogeneousObjects($this->_testData);
    static::assertEquals($expected, $actual);
  }

  function test_build() {
    $expected = "\"a\";\"b\";\"c\";\"d\"\n\"A\";\"B\";;\n\"Ä\";\"B\";\"C\";\n;;;\"D\"";
    static::assertSame($expected, CSV::build($this->_testData));
  }

  function test_build_withColumnNames() {
    $expected = "\"a\";\"d\"\n\"A\";\n\"Ä\";\n;\"D\"";
    static::assertSame($expected, CSV::build($this->_testData, ['a', 'd']));
  }

  function test_cell() {
    static::assertSame('', CSV::cell(null));
    static::assertSame('""', CSV::cell(''));
    static::assertSame('"1"', CSV::cell(1));
    static::assertSame('"1.5"', CSV::cell(1.5));
    static::assertSame('"a;b"', CSV::cell('a;b'));
    static::assertSame("\"line1\nline2\"", CSV::cell("line1\nline2"));
    static::assertSame('"say ""hi"""', CSV::cell('say "hi"'));
  }

  function test_build_keepsStructureWithHostileValues() {
    $data = [['a' => 'x";"injected', 'b' => "multi\nline"]];
    $expected = "\"a\";\"b\"\n\"x\"\";\"\"injected\";\"multi\nline\"";
    static::assertSame($expected, CSV::build($data));
    static::assertSame([['a', 'b'], ['x";"injected', "multi\nline"]], self::parse($expected));
  }

  private static function parse(string $csv): array {
    $handle = fopen('php://memory', 'r+');
    fwrite($handle, $csv);
    rewind($handle);
    $rows = [];
    while (($row = fgetcsv($handle, null, CSV::DELIMITER, CSV::ENCLOSURE, '')) !== false) {
      $rows[] = $row;
    }
    fclose($handle);
    return $rows;
  }
}
