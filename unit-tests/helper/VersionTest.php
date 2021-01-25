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
    }
}
