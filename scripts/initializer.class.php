<?php

require_once(realpath(dirname(__FILE__)) . '/../vo_code/DBConnectionSuperadmin.php');
require_once(realpath(dirname(__FILE__)) . '/../vo_code/DBConnectionTC.php');
require_once(realpath(dirname(__FILE__)) . '/../vo_code/DBConnectionStart.php');

/**
 * Class DBConnectionStarter
 */
class Initializer extends DBConnectionSuperadmin {

    /**
     *
     * adds a new super user to db, if user table is empty (!)
     *
     * @param $username - name for the super user to create
     * @param $userpassword  - password for the super user to create
     * @return boolean - true if user was created, false if not (but no error occurred)
     * @throws Exception - if error occurs during connection
     */
    public function addSuperuser($username, $userpassword) {

        $sql = $this->pdoDBhandle->prepare('SELECT users.name FROM users');

        if (!$sql->execute()) {
            throw new Exception('Could not select from table `users` - database not initialized correctly?');
        }

        $data = $sql->fetchAll(PDO::FETCH_ASSOC);

        if (count($data)) {
            return false;
        }

        $sql = $this->pdoDBhandle->prepare('INSERT INTO users (name, password, is_superadmin) VALUES (:user_name, :user_password, true)');
        $params = array(
            ':user_name' => $username,
            ':user_password' => $this->encryptPassword($userpassword)
        );

        if (!$sql->execute($params)) {
            throw new Exception('Could not insert into table `users`');
        }

        return true;
    }


    /**
     * creates a new workspace with $name, if it does not exist
     *
     * @param $name - name for the new workspace
     * @return int - workspace id
     * @throws Exception - if error occurs
     */
    public function getWorkspace($name) {

        if (!$this->pdoDBhandle) {
            throw new Exception('no database connection');
        }

        $sql = $this->pdoDBhandle->prepare("SELECT workspaces.id FROM workspaces WHERE `name` = :ws_name");
        $sql->execute(array(':ws_name' => $name));

        $workspaces_names = $sql->fetchAll(PDO::FETCH_ASSOC);

        if (count($workspaces_names)) {
            return $workspaces_names[0]['id'];
        }

        if (!$this->addWorkspace($name)) {
            throw new Exception("Could not insert `$name` into table `workspaces`" . "SELECT workspaces.id FROM workspaces WHERE name = '$name'");
        }

        return $this->getWorkspace($name);
    }

    /**
     *
     * grants RW rights to a given workspace( by id) to a user
     * @param $userName
     * @param $workspaceId
     */
    public function grantRights($userName, $workspaceId) {

        $user = $this->getUserByName($userName);

        $this->setWorkspacesByUser($user['id'], array((object) array(
            "id" => $workspaceId,
            "role" => "RW"
        )));
    }

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
    private function _createSubdirectories($dirPath) {

        return array_reduce(explode('/', $dirPath), function($agg, $item) {
            $agg .= "$item/";
            if (file_exists($agg) and !is_dir($agg)) {
                throw new Exception("$agg is not a directory, but should be!");
            }
            if (!file_exists($agg)) {
                mkdir($agg);
            }
            return $agg;
        }, "");

    }

    /**
     * @param $workspaceId
     * @param $filename - Filename in sampledata directory. For resources with extension.
     * @param array $vars - key-value list to replace placeholders in sample files
     * @param bool $isResource - set true if it's a unitplayer or voud file
     * @throws Exception
     */
    private function _importSampleFile($workspaceId, $filename, $vars = array(), $isResource = false) {

        $path = realpath(dirname(__FILE__) . "/../");

        $ext = $isResource ? '' : '.xml';
        $importFileName = "$path/sampledata/$filename$ext";
        $sampleFileContent = file_get_contents($importFileName);

        if (!$sampleFileContent) {
            throw new Exception("Sample file not found: $importFileName");
        }

        foreach ($vars as $key => $value) {
            $sampleFileContent = str_replace('__' . strtoupper($key) . '__', $value, $sampleFileContent);
        }

        $destinationSubDir = $isResource ? 'Resource' : $filename;
        $fileNameToWrite = $this->_createSubdirectories("$path/vo_data/ws_$workspaceId/$destinationSubDir/") . strtoupper("sample_$filename$ext");
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
     * @param $workspace - _number_ of workspace where to import
     * @param $parameters - assoc array of parameters. they can replace placeholders like __TEST_LOGIN__ in the sample
     * data files if given
     * @throws Exception
     */
    public function importSampleData($workspace, $parameters) {

        $this->_importSampleFile($workspace, 'Booklet', $parameters);
        $this->_importSampleFile($workspace, 'Testtakers', $parameters);
        $this->_importSampleFile($workspace, 'SysCheck', $parameters);
        $this->_importSampleFile($workspace, 'Unit', $parameters);
        $this->_importSampleFile($workspace, 'Player.html', $parameters, true);

        echo "Sample data parameters: \n";
        echo implode("\n", array_map(function($param_key) use ($parameters) {return "$param_key: {$parameters[$param_key]}";}, array_keys($parameters)));
    }

    /**
     * @param $loginCode
     */
    public function createSampleLoginsReviewsLogs($loginCode) {

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
     * sets all files an subdirs of datadir to 777. this is needed by the dredd test for example.
     */
    public function openPermissionsOnDataDir() {

        $path = realpath(dirname(__FILE__) . "/../vo_data");
        $this->_openPermissionsOnDir($path);
    }

    /**
     * @param $path
     */
    private function _openPermissionsOnDir($path) {

        $dir = new DirectoryIterator($path);
        foreach ($dir as $item) {
            chmod($item->getPathname(), 0777);
            if ($item->isDir() && !$item->isDot()) {
                $this->_openPermissionsOnDir($item->getPathname());
            }
        }
    }

}
