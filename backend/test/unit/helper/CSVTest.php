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
    $expected = "'a','b','c','d'\n'A','B','',''\n'Ä','B','C',''\n'','','','D'";
    $actual = CSV::build($this->_testData, array(), ',', "'");
    $this->assertEquals($expected, $actual);

    $expected = "\"a\";\"d\"\n\"A\";\"\"\n\"Ä\";\"\"\n\"\";\"D\"";
    $actual = CSV::build($this->_testData, ['a', 'd'], ';', '\"');
    $this->assertEquals($expected, $actual);
  }
}
