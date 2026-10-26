<?php

/** @noinspection PhpIllegalPsrClassPathInspection */

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class VersionTest extends TestCase {
  function setUp(): void {
    SystemConfig::$system_version = '5.1.0';
  }

  function test_isCompatible() {
    static::assertFalse(Version::isCompatible('5.2.0', '5.1.0'));
    static::assertTrue(Version::isCompatible('5.1.0', '5.1.0'));
    static::assertTrue(Version::isCompatible('5.1', '5.1.0'));
    static::assertTrue(Version::isCompatible('5.0', '5.1.0'));
    static::assertTrue(Version::isCompatible('5', '5.1.0'));
    static::assertTrue(Version::isCompatible('5', '5.1.0'));
    static::assertTrue(Version::isCompatible('5.1.0', '5.1.0'));
    static::assertTrue(Version::isCompatible('5.1.0', '5.1'));
    static::assertFalse(Version::isCompatible('5.1.0', '5'));
    static::assertFalse(Version::isCompatible('5.1.0', '5.0'));
    static::assertFalse(Version::isCompatible('5.1.0', '5.0.0'));
    static::assertFalse(Version::isCompatible('6.0.0', '5.1.0'));
    static::assertFalse(Version::isCompatible('6.0', '5.1.0'));
    static::assertFalse(Version::isCompatible('6', '5.1.0'));
    static::assertFalse(Version::isCompatible('6', '5.1'));
    static::assertFalse(Version::isCompatible('6', '5'));
    static::assertFalse(Version::isCompatible('4.0.0', '5.1.0'));
    static::assertFalse(Version::isCompatible('4.0', '5.1'));
    static::assertFalse(Version::isCompatible('4', '5'));
    static::assertFalse(Version::isCompatible('4', '5'));
    static::assertTrue(Version::isCompatible('5.1.0', '5.1.0-alpha'));
    static::assertTrue(Version::isCompatible('5.1.0-beta', '5.1.0-alpha'));
    static::assertTrue(Version::isCompatible('5.1.0-beta', '5.1.0'));
  }

  function test_compare() {
    static::assertEquals(1, Version::compare('6.0.0', '5.0.0'));
    static::assertEquals(1, Version::compare('6.0.0', '5.9.0'));
    static::assertEquals(1, Version::compare('6.0.0', '5.9.99'));
    static::assertEquals(1, Version::compare('6.0.0', '5'));
    static::assertEquals(1, Version::compare('6.0.0', '5.9'));
    static::assertEquals(0, Version::compare('6.0.0', '6.0.0'));
    static::assertEquals(0, Version::compare('6.0', '6.0.0'));
    static::assertEquals(0, Version::compare('6', '6.0.0'));
    static::assertEquals(0, Version::compare('6.0.0', '6.0'));
    static::assertEquals(0, Version::compare('6.0.0', '6'));
    static::assertEquals(0, Version::compare('6.0', '6.0'));
    static::assertEquals(0, Version::compare('6', '6'));
    static::assertEquals(-1, Version::compare('6.0.0', '6.0.1'));
    static::assertEquals(-1, Version::compare('6.0.0', '6.1.0'));
    static::assertEquals(-1, Version::compare('6.0.0', '7.0.0'));
    static::assertEquals(-1, Version::compare('5.9.9', '6.0.0'));
    static::assertEquals(-1, Version::compare('5.9', '6.0.0'));
    static::assertEquals(-1, Version::compare('4', '6.0.0'));
    static::assertEquals(-1, Version::compare('3', '5'));
    static::assertEquals(-1, Version::compare('5.4', '5.5'));
    static::assertEquals(-1, Version::compare('5.4.9999', '5.5'));
    static::assertEquals(-1, Version::compare('7.0.0-alpha', '7.0.0-beta'));
    static::assertEquals(1, Version::compare('7.0.0-beta', '7.0.0-alpha'));
    static::assertEquals(0, Version::compare('7.0.0-alpha', '7.0.0-alpha'));
  }

  function test_compare_with_sort() {
    $versions = [
      '10.9.8-patch7',
      '2.2.1',
      '10.9.8-patch8',
      '2.1',
      '100.9.8-patch7',
      '2.2',
      '2.20.10',
      '2.20.1',
      '1.9.8-patch7',
      '2',
      '9.9.8'
    ];
    $sorted = [
      '1.9.8-patch7',
      '2',
      '2.1',
      '2.2',
      '2.2.1',
      '2.20.1',
      '2.20.10',
      '9.9.8',
      '10.9.8-patch7',
      '10.9.8-patch8',
      '100.9.8-patch7'
    ];
    usort($versions, [Version::class, 'compare']);
    static::assertEquals($sorted, $versions);
  }

  function test_guessFromFileName() {
    $result = Version::guessFromFileName("NO-Version.HtmL");
    static::assertEquals([
      'full' => '',
      'major' => 0,
      'minor' => 0,
      'patch' => 0,
      'label' => '',
      'module' => 'NO-Version'
    ], $result);

    $result = Version::guessFromFileName("whatever-1.2.3-patch.HtmL");
    static::assertEquals([
      'full' => "1.2.3-patch",
      'major' => 1,
      'minor' => 2,
      'patch' => 3,
      'label' => "patch",
      'module' => 'whatever'
    ], $result);

    $result = Version::guessFromFileName("whatever-1.2-patch.HtmL");
    static::assertEquals([
      'full' => "1.2-patch",
      'major' => 1,
      'minor' => 2,
      'patch' => 0,
      'label' => "patch",
      'module' => 'whatever'
    ], $result);

    $result = Version::guessFromFileName("whatever-1-patch.HtmL");
    static::assertEquals([
      'full' => "1-patch",
      'major' => 1,
      'minor' => 0,
      'patch' => 0,
      'label' => "patch",
      'module' => 'whatever'
    ], $result);

    $result = Version::guessFromFileName("whatever-1.HtmL");
    static::assertEquals([
      'full' => "1",
      'major' => 1,
      'minor' => 0,
      'patch' => 0,
      'label' => "",
      'module' => 'whatever'
    ], $result);

    $result = Version::guessFromFileName("ILIKEUPPACERforSOMEREAsonV12.HTML");
    static::assertEquals([
      'full' => "12",
      'major' => 12,
      'minor' => 0,
      'patch' => 0,
      'label' => "",
      'module' => 'ILIKEUPPACERforSOMEREAson'
    ], $result);

    $result = Version::guessFromFileName("no-u-use@1.2.HTML");
    static::assertEquals([
      'full' => "1.2",
      'major' => 1,
      'minor' => 2,
      'patch' => 0,
      'label' => "",
      'module' => 'no-u-use'
    ], $result);

    $result = Version::guessFromFileName("But-Not-1-times-this.HTML");
    static::assertEquals([
      'full' => "1-times-this",
      'major' => 1,
      'minor' => 0,
      'patch' => 0,
      'label' => "times-this",
      'module' => 'But-Not'
    ], $result);
  }

  function test_asString() {
    $result = Version::asString(0, 1, 2, 'alpha');
    static::assertEquals('0.1.2-alpha', $result);

    $result = Version::asString(3, 4, 5, '');
    static::assertEquals('3.4.5', $result);

    $result = Version::asString(0, 0, 0, '');
    static::assertNull($result);
  }
}
