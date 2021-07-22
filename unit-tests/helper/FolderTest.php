<?php

use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;

class FolderTest extends TestCase {


    private vfsStreamDirectory $vfs;

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
    }

    function setUp(): void {

        $this->vfs = VfsForTest::setUp();
    }


    function test_glob() {

        $realGlobResult = glob(__DIR__ . '/*');
        $globResult = Folder::glob(__DIR__, '*');
        $this->assertEquals($realGlobResult, $globResult);

        $realGlobResult = glob(__DIR__ . '/*.php');
        $globResult = Folder::glob(__DIR__, '*.php');
        $this->assertEquals($realGlobResult, $globResult);

        $realGlobResult = glob(__DIR__ . '/*.*');
        $globResult = Folder::glob(__DIR__, '*.*');
        $this->assertEquals($realGlobResult, $globResult);
    }


    function test_getContentsRecursive() {

        $result = Folder::getContentsRecursive($this->vfs->url() . '/vo_data');
        $expected = [
            "ws_1" => [
                "Booklet" => [
                    "SAMPLE_BOOKLET.XML",
                    "SAMPLE_BOOKLET2.XML",
                    "SAMPLE_BOOKLET3.XML",
                    "trash.xml"
                ],
                "Testtakers" => [
                    "SAMPLE_TESTTAKERS.XML",
                    "trash.xml"
                ],
                "SysCheck" => [
                    "SAMPLE_SYSCHECK.XML",
                    "reports" => [
                        "SAMPLE_SYSCHECK-REPORT.JSON"
                    ]
                ],
                "Unit" => [
                   "SAMPLE_UNIT.XML",
                   "SAMPLE_UNIT2.XML"
                ],
                "Resource" => [
                    "SAMPLE_UNITCONTENTS.HTM",
                    "verona-simple-player-2.html"
                ]
            ]
        ];
        $this->assertEquals($expected, $result);
    }


    function test_getContentsFlat() {

        $result = Folder::getContentsFlat($this->vfs->url() . '/vo_data');
        $expected = [
            "ws_1/Booklet/SAMPLE_BOOKLET.XML",
            "ws_1/Booklet/SAMPLE_BOOKLET2.XML",
            "ws_1/Booklet/SAMPLE_BOOKLET3.XML",
            "ws_1/Booklet/trash.xml",
            "ws_1/Testtakers/SAMPLE_TESTTAKERS.XML",
            "ws_1/Testtakers/trash.xml",
            "ws_1/SysCheck/SAMPLE_SYSCHECK.XML",
            "ws_1/SysCheck/reports/SAMPLE_SYSCHECK-REPORT.JSON",
            "ws_1/Unit/SAMPLE_UNIT.XML",
            "ws_1/Unit/SAMPLE_UNIT2.XML",
            "ws_1/Resource/SAMPLE_UNITCONTENTS.HTM",
            "ws_1/Resource/verona-simple-player-2.html"
        ];
        $this->assertEquals($expected, $result);
    }


    function test_deleteContentsRecursive() {

        Folder::deleteContentsRecursive($this->vfs->url() . '/vo_data/ws_1/SysCheck');
        $result = Folder::getContentsFlat($this->vfs->url() . '/vo_data');
        $expected = [
            "ws_1/Booklet/SAMPLE_BOOKLET.XML",
            "ws_1/Booklet/SAMPLE_BOOKLET2.XML",
            "ws_1/Booklet/SAMPLE_BOOKLET3.XML",
            "ws_1/Booklet/trash.xml",
            "ws_1/Testtakers/SAMPLE_TESTTAKERS.XML",
            "ws_1/Testtakers/trash.xml",
            "ws_1/Unit/SAMPLE_UNIT.XML",
            "ws_1/Unit/SAMPLE_UNIT2.XML",
            "ws_1/Resource/SAMPLE_UNITCONTENTS.HTM",
            "ws_1/Resource/verona-simple-player-2.html"
        ];
        $this->assertEquals($expected, $result);
    }
}
