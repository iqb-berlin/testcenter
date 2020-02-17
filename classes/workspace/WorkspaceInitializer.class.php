<?php

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
    private function _createSubdirectories(string $dirPath) {

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

    /**
     * @param int $workspaceId
     * @param string $filename - Filename in sampledata directory.
     * @param array $vars - key-value list to replace placeholders in sample files
     * @param string|null $destination - destination folder like "SysCheck/Reports" or "Resource". Null for auto.
     * @throws Exception
     */
    private function _importSampleFile(int $workspaceId, string $filename, array $vars = array(), string $destination = null) {

        $path = ROOT_DIR;
        $importFileName = "$path/sampledata/$filename";
        $sampleFileContent = file_get_contents($importFileName);

        if (!$sampleFileContent) {
            throw new Exception("Sample file not found: $importFileName");
        }

        foreach ($vars as $key => $value) {
            $sampleFileContent = str_replace('__' . strtoupper($key) . '__', $value, $sampleFileContent);
        }

        $destinationSubDir = $destination ? $destination : basename($filename, '.xml');
        $fileNameToWrite = $this->_createSubdirectories("$path/vo_data/ws_$workspaceId/$destinationSubDir") . strtoupper("sample_$filename");

        if (!file_put_contents($fileNameToWrite, $sampleFileContent)) {
            throw new Exception("Could not write file: $fileNameToWrite");
        }
    }

    /**
     *
     * generated a random login
     * @return string
     */
    private function _generateLogin() {

        $login = "";
        while (strlen($login) < 3) {
            $login .= substr("abcdefghijklmnopqrstuvwxyz", rand(0, 25), 1);
        }
        return $login;
    }

    /**
     * returns a string with 10 randomized 3-letter logins codes
     *
     * @return array
     */
    public function getLoginCodes() {

        return array_map(array($this, '_generateLogin'), range(0, 9));
    }

    /**
     * @param $workspaceId - _number_ of workspace where to import
     * @param $parameters - assoc array of parameters. they can replace placeholders like __TEST_LOGIN__ in the sample
     * data files if given
     * @throws Exception
     */
    public function importSampleData(int $workspaceId, array $parameters) {

        $this->_importSampleFile($workspaceId, 'Booklet.xml', $parameters);
        $this->_importSampleFile($workspaceId, 'Testtakers.xml', $parameters);
        $this->_importSampleFile($workspaceId, 'SysCheck.xml', $parameters);
        $this->_importSampleFile($workspaceId, 'Unit.xml', $parameters);
        $this->_importSampleFile($workspaceId, 'Player.html', $parameters, 'Resource');
        $this->_importSampleFile($workspaceId, 'SysCheck-Report.json', $parameters, 'SysCheck/reports');
    }

    /**
     * @param $loginCode
     * @throws Exception
     */
    public function createSampleLoginsReviewsLogs(string $loginCode) {

        $timestamp = microtime(true) * 1000;

        $dbc = new DBConnectionStart();
        $token = $dbc->login(1, 'sample_group', 'test', 'hot', "");
        $bookletDbIdAndPersontoken = $dbc->startBookletByLoginToken($token, $loginCode, 'BOOKLET.SAMPLE', "sample_booklet_label");
        $bookletDbId = $bookletDbIdAndPersontoken['bookletDbId'];

        $dbc = new DBConnectionTC();
        $dbc->addBookletReview($bookletDbId, 1, "", "sample booklet review");
        $dbc->addUnitReview($bookletDbId, "UNIT.SAMPLE", 1, "", "this is a sample unit review");
        $dbc->addUnitLog($bookletDbId, 'UNIT.SAMPLE', "sample unit log", $timestamp);
        $dbc->addBookletLog($bookletDbId, "sample log entry", $timestamp);
        $dbc->newResponses($bookletDbId, 'UNIT.SAMPLE', "{\"name\":\"Sam Sample\",\"age\":34}", "", $timestamp);
        $dbc->setUnitLastState($bookletDbId, "UNIT.SAMPLE", "PRESENTATIONCOMPLETE", "yes");


    }

    /**
     * sets all files and subdirectories of datadir to 777. this is needed by the Dredd test for example.
     */
    public function openPermissionsOnDataDir() {

        $path = realpath(dirname(__FILE__) . "/../vo_data");
        $this->_openPermissionsOnDir($path);
    }

    /**
     * @param $path
     */
    private function _openPermissionsOnDir(string $path) {

        $dir = new DirectoryIterator($path);
        foreach ($dir as $item) {
            chmod($item->getPathname(), 0777);
            if ($item->isDir() && !$item->isDot()) {
                $this->_openPermissionsOnDir($item->getPathname());
            }
        }
    }

}
