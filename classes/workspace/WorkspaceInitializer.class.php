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
    private function createSubdirectories(string $dirPath) {

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


    private function importSampleFile(int $workspaceId, string $source, string $target, InstallationArguments $vars) {

        $importFileName = ROOT_DIR . '/' . $source;
        $fileContent = file_get_contents($importFileName);

        if (!$fileContent) {
            throw new Exception("File not found: `$importFileName`");
        }

        foreach ($vars as $key => $value) {
            $fileContent = str_replace('__' . strtoupper($key) . '__', $value, $fileContent);
        }

        $dir = pathinfo($target, PATHINFO_DIRNAME);;
        $fileName = basename($target);
        $fileName = $this->createSubdirectories(DATA_DIR . "/ws_$workspaceId/$dir") . $fileName;

        if (@file_put_contents($fileName, $fileContent) === false) {
            throw new Exception("Could not write file: $fileName");
        }
    }


    /**
     * @param $workspaceId - _number_ of workspace where to import
     * @param $parameters - assoc array of parameters. they can replace placeholders like __TEST_LOGIN__ in the sample
     * data files if given
     * @throws Exception
     */
    public function importSampleData(int $workspaceId, InstallationArguments $parameters): void {

        foreach ($this::sampleDataPaths as $source => $target) {

            if (!file_exists(ROOT_DIR . '/' . $source)) {
                throw new Exception("File not found: `$source`");
            }
        }

        foreach ($this::sampleDataPaths as $source => $target) {

            $this->importSampleFile($workspaceId, $source, $target, $parameters);
        }
    }


    public function cleanWorkspace(int $workspaceId): void {

        Folder::deleteContentsRecursive(DATA_DIR . "/ws_$workspaceId/");
    }
}
