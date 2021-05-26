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
      "vendor/iqb-berlin/verona-player-simple/sample-data/introduction-unit.htm" => "Resource/SAMPLE_UNITCONTENTS.HTM",
      "sampledata/Unit2.xml" => "Unit/SAMPLE_UNIT2.XML",
      "vendor/iqb-berlin/verona-player-simple/verona-simple-player-1.html" => "Resource/verona-simple-player-1.html",
      "sampledata/SysCheck-Report.json" => "SysCheck/reports/SAMPLE_SYSCHECK-REPORT.JSON"
    ];

    /**
     * creates missing subdirectories for a missing path,
     * for example: let /var/www/html/vo_data exist
     * and $filePath be /var/www/html/vo_data/ws_5/Testtakers
     * this functions creates ws_5 and ws_5/Testtakers in /var/www/html/vo_data
     * Note: dont' use paths containing filenames!
     *
     * @param $dirPath - a full path
     * @return string - the path, again
     */
    private function createSubdirectories(string $dirPath): string {

        $pathParts = parse_url($dirPath);
        return array_reduce(explode('/', $pathParts['path']), function($agg, $item) {
            $agg .= "$item/";
            if (file_exists($agg) and !is_dir($agg)) {
                throw new Exception("$agg is not a directory, but should be!");
            }
            if (!file_exists($agg)) {
                mkdir($agg);
            }
            return $agg;
        }, isset($pathParts['scheme']) ? "{$pathParts['scheme']}://{$pathParts['host']}" : '');
    }


    private function importSampleFile(int $workspaceId, string $source, string $target) {

        $importFileName = ROOT_DIR . '/' . $source;

        if (!file_exists($importFileName)) {
            throw new Exception("File not found: `$importFileName`");
        }

        $dir = pathinfo($target, PATHINFO_DIRNAME);;
        $fileName = basename($target);
        $fileName = $this->createSubdirectories(DATA_DIR . "/ws_$workspaceId/$dir") . $fileName;

        if (!@copy($importFileName, $fileName)) {
            throw new Exception("Could not write file: $fileName");
        }
    }


    public function importSampleData(int $workspaceId): void {

        foreach ($this::sampleDataPaths as $source => $target) {

            if (!file_exists(ROOT_DIR . '/' . $source)) {
                throw new Exception("File not found: `$source`");
            }
        }

        foreach ($this::sampleDataPaths as $source => $target) {

            $this->importSampleFile($workspaceId, $source, $target);
        }
    }


    public function cleanWorkspace(int $workspaceId): void {

        Folder::deleteContentsRecursive(DATA_DIR . "/ws_$workspaceId/");
        rmdir(DATA_DIR . "/ws_$workspaceId/");
    }
}
