<?php

use PHPUnit\Framework\TestCase;
require_once "classes/helper/FileName.class.php";

class FileNameTest extends TestCase {

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
}
