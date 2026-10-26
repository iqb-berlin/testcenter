<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class TestNameTest extends TestCase {
  function test__fromString(): void {
    $result = TestName::fromString('myBooklet');
    static::assertEquals('myBooklet', $result->name);
    static::assertEquals('myBooklet', $result->bookletFileId);
    static::assertEquals([], $result->states);

    $result = TestName::fromString('myBooklet#a:b;c:d');
    static::assertEquals('myBooklet#a:b;c:d', $result->name);
    static::assertEquals('myBooklet', $result->bookletFileId);
    static::assertEquals(['a' => 'b', 'c' => 'd'], $result->states);
  }
}