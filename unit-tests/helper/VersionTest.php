<?php

/** @noinspection PhpIllegalPsrClassPathInspection */

declare(strict_types=1);

require_once "unit-tests/VfsForTest.class.php";
require_once "classes/helper/JSON.class.php";
require_once "classes/helper/Version.class.php";

use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;

class VersionTest extends TestCase {

    private vfsStreamDirectory $vfs;

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
        VfsForTest::setUp(false);
    }


    function setUp(): void {

        $this->vfs = VfsForTest::setUp(false);
        file_put_contents($this->vfs->url() . '/composer.json', '{"version":"5.1.0"}');
    }

    function test_get() {

        $this->assertEquals('5.1.0', Version::get());
    }


    function test_isCompatible() {

        $this->assertFalse(Version::isCompatible('5.2.0', '5.1.0'));
        $this->assertTrue(Version::isCompatible('5.1.0', '5.1.0'));
        $this->assertTrue(Version::isCompatible('5.1', '5.1.0'));
        $this->assertTrue(Version::isCompatible('5.0', '5.1.0'));
        $this->assertTrue(Version::isCompatible('5', '5.1.0'));
        $this->assertTrue(Version::isCompatible('5', '5.1.0'));
        $this->assertTrue(Version::isCompatible('5.1.0', '5.1.0'));
        $this->assertTrue(Version::isCompatible('5.1.0', '5.1'));
        $this->assertFalse(Version::isCompatible('5.1.0', '5'));
        $this->assertFalse(Version::isCompatible('5.1.0', '5.0'));
        $this->assertFalse(Version::isCompatible('5.1.0', '5.0.0'));
        $this->assertFalse(Version::isCompatible('6.0.0', '5.1.0'));
        $this->assertFalse(Version::isCompatible('6.0', '5.1.0'));
        $this->assertFalse(Version::isCompatible('6', '5.1.0'));
        $this->assertFalse(Version::isCompatible('6', '5.1'));
        $this->assertFalse(Version::isCompatible('6', '5'));
        $this->assertFalse(Version::isCompatible('4.0.0', '5.1.0'));
        $this->assertFalse(Version::isCompatible('4.0', '5.1'));
        $this->assertFalse(Version::isCompatible('4', '5'));
        $this->assertFalse(Version::isCompatible('4', '5'));
        $this->assertTrue(Version::isCompatible('5.1.0', '5.1.0-alpha'));
        $this->assertTrue(Version::isCompatible('5.1.0-beta', '5.1.0-alpha'));
        $this->assertTrue(Version::isCompatible('5.1.0-beta', '5.1.0'));
    }


    function test_compare() {

        $this->assertEquals(1, Version::compare('6.0.0', '5.0.0'));
        $this->assertEquals(1, Version::compare('6.0.0', '5.9.0'));
        $this->assertEquals(1, Version::compare('6.0.0', '5.9.99'));
        $this->assertEquals(1, Version::compare('6.0.0', '5'));
        $this->assertEquals(1, Version::compare('6.0.0', '5.9'));
        $this->assertEquals(0, Version::compare('6.0.0', '6.0.0'));
        $this->assertEquals(0, Version::compare('6.0', '6.0.0'));
        $this->assertEquals(0, Version::compare('6', '6.0.0'));
        $this->assertEquals(0, Version::compare('6.0.0', '6.0'));
        $this->assertEquals(0, Version::compare('6.0.0', '6'));
        $this->assertEquals(0, Version::compare('6.0', '6.0'));
        $this->assertEquals(0, Version::compare('6', '6'));
        $this->assertEquals(-1, Version::compare('6.0.0', '6.0.1'));
        $this->assertEquals(-1, Version::compare('6.0.0', '6.1.0'));
        $this->assertEquals(-1, Version::compare('6.0.0', '7.0.0'));
        $this->assertEquals(-1, Version::compare('5.9.9', '6.0.0'));
        $this->assertEquals(-1, Version::compare('5.9', '6.0.0'));
        $this->assertEquals(-1, Version::compare('4', '6.0.0'));
        $this->assertEquals(-1, Version::compare('3', '5'));
        $this->assertEquals(-1, Version::compare('5.4', '5.5'));
        $this->assertEquals(-1, Version::compare('5.4.9999', '5.5'));
        $this->assertEquals(-1, Version::compare('7.0.0-alpha', '7.0.0-beta'));
        $this->assertEquals(1, Version::compare('7.0.0-beta', '7.0.0-alpha'));
        $this->assertEquals(0, Version::compare('7.0.0-alpha', '7.0.0-alpha'));
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
        ] ;
        usort($versions, [Version::class, 'compare']);
        $this->assertEquals($sorted, $versions);
    }
}
