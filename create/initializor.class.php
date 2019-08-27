<?php

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
    public function addWorkspace($name) {

        if (!($this->pdoDBhandle)) {
            throw new Exception('no database connection');
        }

        $sql = $this->pdoDBhandle->prepare("SELECT workspaces.id FROM workspaces WHERE `name` = :ws_name");
        $sql->execute(array(':ws_name' => $name));

        $workspaces_names = $sql->fetchAll(PDO::FETCH_ASSOC);

        if (count($workspaces_names)) {
            return $workspaces_names[0]['id'];
        }

        if (!parent::addWorkspace($name)) {
            throw new Exception("Could not insert `$name` into table `workspaces`" . "SELECT workspaces.id FROM workspaces WHERE name = '$name'");
        }

        return count($workspaces_names) + 1;
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
     * @param $workspace
     * @param $type
     * @param array $vars
     * @throws Exception
     */
    private function _importSampleFile($workspace, $type, $vars = array()) {

        $path = realpath(dirname(__FILE__) . "/../");
        $sampleFileContent = file_get_contents("$path/sampledata/$type.sample.xml");

        if (!$sampleFileContent) {
            throw new Exception("Sample file not found: $type.sample.xml");
        }

        foreach ($vars as $key => $value) {
            $sampleFileContent = str_replace('__' . strtoupper($key) . '__', $value, $sampleFileContent);
        }

        $fileNameToWrite = $this->_createSubdirectories("$path/vo_data/ws_$workspace/$type/") . strtoupper("$type.sample.xml");
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
     * @param $workspace - _number_ of workspace where to import
     * @param $parameters - assoc array of parameters. they can replace placeholders like __TEST_LOGIN__ in the sample
     * data files if given
     * @throws Exception
     */
    public function importSampleData($workspace, $parameters) {

        $parameters['test_person_codes'] = implode(" ", array_map(array($this, '_generateLogin'), range(0, 9)));

        $this->_importSampleFile($workspace, 'Booklet', $parameters);
        $this->_importSampleFile($workspace, 'Testtakers', $parameters);
        $this->_importSampleFile($workspace, 'SysCheck', $parameters);

        echo "created sample data with parameters: " . print_r($parameters, 1);
    }

}
