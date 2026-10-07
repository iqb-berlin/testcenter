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
    $this->assertEquals($expected, $actual);
  }

  function test_build() {
    $expected = "\"a\";\"b\";\"c\";\"d\"\n\"A\";\"B\";;\n\"Ä\";\"B\";\"C\";\n;;;\"D\"";
    $this->assertSame($expected, CSV::build($this->_testData));
  }

  function test_build_withColumnNames() {
    $expected = "\"a\";\"d\"\n\"A\";\n\"Ä\";\n;\"D\"";
    $this->assertSame($expected, CSV::build($this->_testData, ['a', 'd']));
  }

  function test_cell() {
    $this->assertSame('', CSV::cell(null));
    $this->assertSame('""', CSV::cell(''));
    $this->assertSame('"1"', CSV::cell(1));
    $this->assertSame('"1.5"', CSV::cell(1.5));
    $this->assertSame('"a;b"', CSV::cell('a;b'));
    $this->assertSame("\"line1\nline2\"", CSV::cell("line1\nline2"));
    $this->assertSame('"say ""hi"""', CSV::cell('say "hi"'));
  }

  function test_build_keepsStructureWithHostileValues() {
    $data = [['a' => 'x";"injected', 'b' => "multi\nline"]];
    $expected = "\"a\";\"b\"\n\"x\"\";\"\"injected\";\"multi\nline\"";
    $this->assertSame($expected, CSV::build($data));
    $this->assertSame([['a', 'b'], ['x";"injected', "multi\nline"]], self::parse($expected));
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
