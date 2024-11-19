<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class TestNameTest extends TestCase {
  function test__fromString(): void {
    $result = TestName::fromString('myBooklet');
    $this->assertEquals('myBooklet', $result->name);
    $this->assertEquals('myBooklet', $result->bookletFileId);
    $this->assertEquals([], $result->states);

    $result = TestName::fromString('myBooklet#a:b;c:d');
    $this->assertEquals('myBooklet#a:b;c:d', $result->name);
    $this->assertEquals('myBooklet', $result->bookletFileId);
    $this->assertEquals(['a' => 'b', 'c' => 'd'], $result->states);
  }
}