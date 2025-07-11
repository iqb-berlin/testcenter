<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class WorkspaceInitializer {
  const sampleDataPaths = [
    "default" => [
      "sampledata/Booklet.xml" => "Booklet/SAMPLE_BOOKLET.XML",
      "sampledata/Booklet2.xml" => "Booklet/SAMPLE_BOOKLET2.XML",
      "sampledata/Booklet3.xml" => "Booklet/SAMPLE_BOOKLET3.XML",
      "sampledata/Testtakers.xml" => "Testtakers/SAMPLE_TESTTAKERS.XML",
      "sampledata/SysCheck.xml" => "SysCheck/SAMPLE_SYSCHECK.XML",
      "sampledata/Unit.xml" => "Unit/SAMPLE_UNIT.XML",
      "sampledata/SAMPLE_UNITCONTENTS.HTM" => "Resource/SAMPLE_UNITCONTENTS.HTM",
      "sampledata/Unit2.xml" => "Unit/SAMPLE_UNIT2.XML",
      "sampledata/SysCheck-Report.json" => "SysCheck/reports/SAMPLE_SYSCHECK-REPORT.JSON",
      "sampledata/sample_resource_package.itcr.zip" => "Resource/sample_resource_package.itcr.zip",
      "sampledata/verona-player-simple-6.0.html" => "Resource/verona-player-simple-6.0.html",
      "sampledata/coding-scheme.vocs.json" => "Resource/coding-scheme.vocs.json",
    ],
    "system-test" => [
      "sampledata/system-test/CY_BKL_Mode_Demo.xml" => "Booklet/CY_BKL_Mode_Demo.xml",
      "sampledata/system-test/CY_BKL_Mode_Review.xml" => "Booklet/CY_BKL_Mode_Review.xml",
      "sampledata/system-test/CY_BKL_Mode_RunHotReturn.xml" => "Booklet/CY_BKL_Mode_RunHotReturn.xml",
      "sampledata/system-test/CY_BKL_Mode_RunHotRestart.xml" => "Booklet/CY_BKL_Mode_RunHotRestart.xml",
      "sampledata/system-test/CY_BKL_SessionManagement_HotModi.xml" => "Booklet/CY_BKL_SessionManagement_HotModi.xml",
      "sampledata/system-test/CY_BKL_TimeRestriction.xml" => "Booklet/CY_BKL_TimeRestriction.xml",
      "sampledata/system-test/CY_BKL_Config_default.xml" => "Booklet/CY_BKL_Config_default.xml",
      "sampledata/system-test/CY_BKL_Config_value-1.xml" => "Booklet/CY_BKL_Config_value-1.xml",
      "sampledata/system-test/CY_BKL_Config_value-2.xml" => "Booklet/CY_BKL_Config_value-2.xml",
      "sampledata/system-test/CY_BKL_Config_value-3.xml" => "Booklet/CY_BKL_Config_value-3.xml",
      "sampledata/system-test/CY_BKL_RestrictionLeaveValue-1.xml" => "Booklet/CY_BKL_RestrictionLeaveValue-1.xml",
      "sampledata/system-test/CY_BKL_RestrictionLeaveValue-2.xml" => "Booklet/CY_BKL_RestrictionLeaveValue-2.xml",
      "sampledata/system-test/CY_BKL_RestrictionLeaveValue-3.xml" => "Booklet/CY_BKL_RestrictionLeaveValue-3.xml",
      "sampledata/system-test/CY_BKL_RestrictionNavValue-1.xml" => "Booklet/CY_BKL_RestrictionNavValue-1.xml",
      "sampledata/system-test/CY_BKL_RestrictionNavValue-2.xml" => "Booklet/CY_BKL_RestrictionNavValue-2.xml",
      "sampledata/system-test/CY_BKL_RestrictionNavValue-3.xml" => "Booklet/CY_BKL_RestrictionNavValue-3.xml",
      "sampledata/system-test/CY_BKL_RestrLockAfterLeave-1.xml" => "Booklet/CY_BKL_RestrLockAfterLeave-1.xml",
      "sampledata/system-test/CY_BKL_RestrLockAfterLeave-2.xml" => "Booklet/CY_BKL_RestrLockAfterLeave-2.xml",
      "sampledata/system-test/CY_BKL_SpeedPlayer.xml" => "Booklet/CY_BKL_SpeedPlayer.xml",
      "sampledata/system-test/CY_Test_Logins.xml" => "Testtakers/CY_Test_Logins.xml",
      "sampledata/system-test/CY_SysCheck_2.xml" => "SysCheck/CY_SysCheck_2.xml",
      "sampledata/system-test/CY_Unit100.xml" => "Unit/CY_SAMPLE_UNIT100.XML",
      "sampledata/system-test/CY_Unit101.xml" => "Unit/CY_SAMPLE_UNIT101.XML",
      "sampledata/system-test/CY_Unit102.xml" => "Unit/CY_SAMPLE_UNIT102.XML",
      "sampledata/system-test/CY_Unit103.xml" => "Unit/CY_SAMPLE_UNIT103.XML",
      "sampledata/system-test/CY_Unit104.xml" => "Unit/CY_SAMPLE_UNIT104.XML",
      "sampledata/system-test/CY_speedUnit1.voud" => "Resource/CY_speedUnit1.voud",
      "sampledata/system-test/CY_speedUnit2.voud" => "Resource/CY_speedUnit2.voud",
      "sampledata/system-test/iqb-player-speedtest-3.0.6.html" => "Resource/iqb-player-speedtest-3.0.6.html",
      "sampledata/system-test/CY_speedUnit1.xml" => "Unit/CY_speedUnit1.xml",
      "sampledata/system-test/CY_speedUnit2.xml" => "Unit/CY_speedUnit2.xml",
    ]
  ];

  private function importSampleFile(int $workspaceId, string $source, string $target): void {
    $importFileName = ROOT_DIR . '/' . $source;

    if (!file_exists($importFileName)) {
      throw new Exception("File not found: `$importFileName`");
    }

    $dir = pathinfo($target, PATHINFO_DIRNAME);
    $fileName = basename($target);
    $fileName = Folder::createPath(DATA_DIR . "/ws_$workspaceId/$dir") . $fileName;

    if (!@copy($importFileName, $fileName)) {
      throw new Exception("Could not write file: $fileName");
    }
  }

  public function importSampleFiles(int $workspaceId, string $sampleFileSet = 'default'): void {
    foreach (self::sampleDataPaths[$sampleFileSet] as $source => $target) {
      $this->importSampleFile($workspaceId, $source, $target);
    }
  }

  public function cleanWorkspace(int $workspaceId): void {
    Folder::deleteContentsRecursive(DATA_DIR . "/ws_$workspaceId/");
    rmdir(DATA_DIR . "/ws_$workspaceId/");
  }

  public function createSampleScanImage(string $fileName, int $workspaceId): void {
    $png = '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da636460f85f0f0002870180eb47ba920000000049454e44ae426082';
    file_put_contents(
      Folder::createPath(DATA_DIR . "/ws_$workspaceId") . $fileName,
      hex2bin($png)
    );
  }
}