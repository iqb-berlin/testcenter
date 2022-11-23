<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class WorkspaceInitializer {


    const sampleDataPaths = [
      "sampledata/Booklet.xml" => "Booklet/SAMPLE_BOOKLET.XML",
      "sampledata/Booklet2.xml" => "Booklet/SAMPLE_BOOKLET2.XML",
      "sampledata/Booklet3.xml" => "Booklet/SAMPLE_BOOKLET3.XML",
      "sampledata/Testtakers.xml" => "Testtakers/SAMPLE_TESTTAKERS.XML",
      "sampledata/SysCheck.xml" => "SysCheck/SAMPLE_SYSCHECK.XML",
      "sampledata/Unit.xml" => "Unit/SAMPLE_UNIT.XML",
      "sampledata/introduction-unit.htm" => "Resource/SAMPLE_UNITCONTENTS.HTM",
      "sampledata/Unit2.xml" => "Unit/SAMPLE_UNIT2.XML",
      "sampledata/SysCheck-Report.json" => "SysCheck/reports/SAMPLE_SYSCHECK-REPORT.JSON",
      "sampledata/sample_resource_package.itcr.zip" => "Resource/sample_resource_package.itcr.zip",
      "sampledata/verona-player-simple-4.0.0.html" => "Resource/verona-player-simple-4.0.0.html"
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


    public function importSampleFiles(int $workspaceId): void {

        foreach ($this::sampleDataPaths as $source => $target) {

            $this->importSampleFile($workspaceId, $source, $target);
        }
    }


    public function cleanWorkspace(int $workspaceId): void {

        Folder::deleteContentsRecursive(DATA_DIR . "/ws_$workspaceId/");
        rmdir(DATA_DIR . "/ws_$workspaceId/");
    }


    public function createSampleScanImage(int $workspaceId): string {

        $png = <<<END
\89PNG

\00\00\00
IHDR\00\00\00\00\00\00\00\00\00%\DBV\CA\00\00\00PLTE\00\00\00\A7z=\DA\00\00\00tRNS\00@\E6\D8f\00\00\00
IDAT\D7c`\00\00\00\00\E2!\BC3\00\00\00\00IEND\AEB`\82
END;
        $fileName = 'sample_scanned_image.png';
        file_put_contents(Folder::createPath(DATA_DIR . "/ws_$workspaceId/") . $fileName, $png);
        return $fileName;
    }
}
