<?php

/** @noinspection PhpIllegalPsrClassPathInspection */

declare(strict_types=1);

use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class VersionTest extends TestCase {

    private vfsStreamDirectory $vfs;

    public static function setUpBeforeClass(): void {

        require_once "test/unit/VfsForTest.class.php";
        VfsForTest::setUpBeforeClass();
    }


    function setUp(): void {

        require_once "src/helper/JSON.class.php";
        require_once "src/helper/Version.class.php";

        $this->vfs = VfsForTest::setUp(false);
        file_put_contents($this->vfs->url() . '/package.json', '{"version":"5.1.0"}');
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


    function test_guessFromFileName() {

        $result = Version::guessFromFileName("NO-Version.HtmL");
        $this->assertEquals([
            'full' => '',
            'major' => 0,
            'minor' => 0,
            'patch' => 0,
            'label' => '',
            'module' => 'NO-Version'
        ], $result);

        $result = Version::guessFromFileName("whatever-1.2.3-patch.HtmL");
        $this->assertEquals([
            'full' => "1.2.3-patch",
            'major' => 1,
            'minor' => 2,
            'patch' => 3,
            'label' => "patch",
            'module' => 'whatever'
        ], $result);

        $result = Version::guessFromFileName("whatever-1.2-patch.HtmL");
        $this->assertEquals([
            'full' => "1.2-patch",
            'major' => 1,
            'minor' => 2,
            'patch' => 0,
            'label' => "patch",
            'module' => 'whatever'
        ], $result);

        $result = Version::guessFromFileName("whatever-1-patch.HtmL");
        $this->assertEquals([
            'full' => "1-patch",
            'major' => 1,
            'minor' => 0,
            'patch' => 0,
            'label' => "patch",
            'module' => 'whatever'
        ], $result);

        $result = Version::guessFromFileName("whatever-1.HtmL");
        $this->assertEquals([
            'full' => "1",
            'major' => 1,
            'minor' => 0,
            'patch' => 0,
            'label' => "",
            'module' => 'whatever'
        ], $result);

        $result = Version::guessFromFileName("ILIKEUPPACERforSOMEREAsonV12.HTML");
        $this->assertEquals([
            'full' => "12",
            'major' => 12,
            'minor' => 0,
            'patch' => 0,
            'label' => "",
            'module' => 'ILIKEUPPACERforSOMEREAson'
        ], $result);

        $result = Version::guessFromFileName("no-u-use@1.2.HTML");
        $this->assertEquals([
            'full' => "1.2",
            'major' => 1,
            'minor' => 2,
            'patch' => 0,
            'label' => "",
            'module' => 'no-u-use'
        ], $result);

        $result = Version::guessFromFileName("But-Not-1-times-this.HTML");
        $this->assertEquals([
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
        $this->assertEquals('0.1.2-alpha', $result);

        $result = Version::asString(3, 4, 5, '');
        $this->assertEquals('3.4.5', $result);

        $result = Version::asString(0, 0, 0, '');
        $this->assertNull($result);
    }
}
