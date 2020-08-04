<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class WorkspaceInitializer {


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


    private function importSampleFile(int $workspaceId, string $filename,
                                      InstallationArguments $vars, string $destination = null) {

        $importFileName = ROOT_DIR . "/sampledata/$filename";
        $sampleFileContent = file_get_contents($importFileName);

        if (!$sampleFileContent) {
            throw new Exception("Sample file not found: $importFileName");
        }

        foreach ($vars as $key => $value) {
            $sampleFileContent = str_replace('__' . strtoupper($key) . '__', $value, $sampleFileContent);
        }

        $destinationSubDir = $destination ? $destination : basename($filename, '.xml');
        $fileNameToWrite = $this->createSubdirectories(DATA_DIR . "/ws_$workspaceId/$destinationSubDir") . strtoupper("sample_$filename");

        if (@file_put_contents($fileNameToWrite, $sampleFileContent) === false) {
            throw new Exception("Could not write file: $fileNameToWrite");
        }
    }


    /**
     * @param $workspaceId - _number_ of workspace where to import
     * @param $parameters - assoc array of parameters. they can replace placeholders like __TEST_LOGIN__ in the sample
     * data files if given
     * @throws Exception
     */
    public function importSampleData(int $workspaceId, InstallationArguments $parameters): void {

        $this->importSampleFile($workspaceId, 'Booklet.xml', $parameters);
        $this->importSampleFile($workspaceId, 'Booklet2.xml', $parameters, 'Booklet');
        $this->importSampleFile($workspaceId, 'Testtakers.xml', $parameters);
        $this->importSampleFile($workspaceId, 'SysCheck.xml', $parameters);
        $this->importSampleFile($workspaceId, 'Unit.xml', $parameters);
        $this->importSampleFile($workspaceId, 'Unit2.xml', $parameters, 'Unit');
        $this->importSampleFile($workspaceId, 'Player.html', $parameters, 'Resource');
        $this->importSampleFile($workspaceId, 'SysCheck-Report.json', $parameters, 'SysCheck/reports');
    }


    public function cleanWorkspace(int $workspaceId): void {

        Folder::deleteContentsRecursive(DATA_DIR . "/ws_$workspaceId/");
    }
}
