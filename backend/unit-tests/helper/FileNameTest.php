<?php

use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class FileNameTest extends TestCase {

    public function setUp(): void {

        require_once "src/helper/FileName.class.php";
    }

    function test_normalize() {

        $result = FileName::normalize("no-version.html", true);
        $this->assertEquals("NO-VERSION.HTML", $result);

        $result = FileName::normalize("no-version.html", false);
        $this->assertEquals("NO-VERSION.HTML", $result);

        $result = FileName::normalize("only-mayor-1.html", true);
        $this->assertEquals("ONLY-MAYOR-1.HTML", $result);

        $result = FileName::normalize("only-mayor-1.html", false);
        $this->assertEquals("ONLY-MAYOR-1.HTML", $result);

        $result = FileName::normalize("mayor-and-minor-1.2.html", true);
        $this->assertEquals("MAYOR-AND-MINOR-1.HTML", $result);

        $result = FileName::normalize("mayor-and-minor-1.2.html", false);
        $this->assertEquals("MAYOR-AND-MINOR-1.2.HTML", $result);

        $result = FileName::normalize("complete-version-1.2.3.html", true);
        $this->assertEquals("COMPLETE-VERSION-1.HTML", $result);

        $result = FileName::normalize("complete-version-1.2.3.html", false);
        $this->assertEquals("COMPLETE-VERSION-1.2.3.HTML", $result);
    }

    function test_hasRecommendedFormat() {

        $result = FileName::hasRecommendedFormat("a-player-1.html", 'a-player', '1', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("a-player-1.html", 'a-player', '1.2', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("a-player-1.html", 'a-player', '1.2.3', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("a-player-1.html", 'a-player', '1.2.3-xx', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("a-player-1.2.html", 'a-player', '1', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("a-player-1.2.html", 'a-player', '1.2', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("a-player-1.2.html", 'a-player', '1.2.3', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("a-player-1.2.html", 'a-player', '1.2.3-xx', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("a-player-1.2.3.html", 'a-player', '1', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("a-player-1.2.3.html", 'a-player', '1.2', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("a-player-1.2.3.html", 'a-player', '1.2.3', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("a-player-1.2.3.html", 'a-player', '1.2.3-xx', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("APlayerV1.html", 'a-player', '1', 'html');
        $this->assertFalse($result);

        $result = FileName::hasRecommendedFormat("A-PLAYER-1.2.3.html", 'a-player', '1.2.3', 'html');
        $this->assertTrue($result);

        $result = FileName::hasRecommendedFormat("a-player@1.2.3.html", 'a-player', '1.2.3', 'html');
        $this->assertFalse($result);

        $result = FileName::hasRecommendedFormat("garbage", 'a-player', '1.2.3-xx', 'html');
        $this->assertFalse($result);
    }
}
