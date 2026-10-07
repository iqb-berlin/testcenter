<?php

use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class FolderTest extends TestCase {
  private vfsStreamDirectory $vfs;

  public static function setUpBeforeClass(): void {
    require_once "test/unit/VfsForTest.class.php";
    VfsForTest::setUpBeforeClass();
  }

  private string $tmpBase = '';

  function setUp(): void {
    $this->vfs = VfsForTest::setUp();
  }

  function tearDown(): void {
    if ($this->tmpBase !== '') {
      $this->removeTree($this->tmpBase);
      $this->tmpBase = '';
    }
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
    $result = Folder::getContentsRecursive($this->vfs->url() . '/data');
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
          "sample_resource_package.itcr.zip",
          "verona-player-simple-6.0.html",
          "coding-scheme.vocs.json"
        ]
      ]
    ];
    $this->assertEquals($expected, $result);
  }

  function test_getContentsFlat() {
    $result = Folder::getContentsFlat($this->vfs->url() . '/data');
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
      "ws_1/Resource/sample_resource_package.itcr.zip",
      "ws_1/Resource/verona-player-simple-6.0.html",
      "ws_1/Resource/coding-scheme.vocs.json"
    ];
    $this->assertEquals($expected, $result);
  }

  // realpath needs a real filesystem, so these use a temp tree rather than vfsStream:
  //   $tmpBase/ws/file.txt   (contained)
  //   $tmpBase/secret.txt    (outside the base)
  //   $tmpBase/ws-evil/      (prefix-sibling of the base)
  private function makeTempTree(): string {
    $this->tmpBase = sys_get_temp_dir() . '/tc_folder_test_' . uniqid('', true);
    mkdir("$this->tmpBase/ws", 0777, true);
    file_put_contents("$this->tmpBase/ws/file.txt", 'contained');
    file_put_contents("$this->tmpBase/secret.txt", 'secret');
    return "$this->tmpBase/ws";
  }

  private function removeTree(string $path): void {
    if (is_link($path)) {
      unlink($path);
    } else if (is_dir($path)) {
      foreach (scandir($path) as $entry) {
        if ($entry !== '.' and $entry !== '..') {
          $this->removeTree("$path/$entry");
        }
      }
      rmdir($path);
    } else if (file_exists($path)) {
      unlink($path);
    }
  }

  function test_getContainedRealPath_returnsPathForContainedFile() {
    $base = $this->makeTempTree();
    $this->assertEquals(realpath("$base/file.txt"), Folder::getContainedRealPath($base, 'file.txt'));
  }

  function test_getContainedRealPath_rejectsTraversalOutsideBase() {
    $base = $this->makeTempTree();
    $this->assertNull(Folder::getContainedRealPath($base, '../secret.txt'));
  }

  function test_getContainedRealPath_rejectsDeepTraversal() {
    $base = $this->makeTempTree();
    $this->assertNull(Folder::getContainedRealPath($base, '../../../../../../etc/passwd'));
  }

  function test_getContainedRealPath_rejectsSymlinkEscape() {
    $base = $this->makeTempTree();
    symlink("$this->tmpBase/secret.txt", "$base/link.txt");
    $this->assertNull(Folder::getContainedRealPath($base, 'link.txt'));
  }

  function test_getContainedRealPath_rejectsPrefixSiblingDir() {
    $base = $this->makeTempTree();
    mkdir("$this->tmpBase/ws-evil");
    file_put_contents("$this->tmpBase/ws-evil/x.txt", 'evil');
    $this->assertNull(Folder::getContainedRealPath($base, '../ws-evil/x.txt'));
  }

  function test_getContainedRealPath_returnsNullForMissingFile() {
    $base = $this->makeTempTree();
    $this->assertNull(Folder::getContainedRealPath($base, 'does-not-exist.txt'));
  }

  function test_deleteContentsRecursive() {
    Folder::deleteContentsRecursive($this->vfs->url() . '/data/ws_1/SysCheck');
    $result = Folder::getContentsFlat($this->vfs->url() . '/data');
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
      "ws_1/Resource/sample_resource_package.itcr.zip",
      "ws_1/Resource/verona-player-simple-6.0.html",
      "ws_1/Resource/coding-scheme.vocs.json"
    ];
    $this->assertEquals($expected, $result);
  }
}
