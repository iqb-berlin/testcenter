<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

class DBConnection {
    protected $pdoDBhandle = false;
    public $errorMsg = '';
    protected $idletime = 60 * 30;

    // __________________________
    public function __construct() {
        try {

            // $this->pdoDBhandle = new PDO("mysql:host=111.11.111.0;port=1111;dbname=testcenter", "user111", "111111");
			// $this->pdoDBhandle = new PDO("pgsql:host=ddbb.ddr.rrt.de;port=5432;dbname=db3456;user=userdb3456;password=db3456");

            $this->pdoDBhandle->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);


        } catch(PDOException $e) {
            $this->errorMsg = $e->getMessage();
            $this->pdoDBhandle = false;
        }
    }

    // __________________________
    public function __destruct() {
        if ($this->pdoDBhandle !== false) {
            unset($this->pdoDBhandle);
            $this->pdoDBhandle = false;
        }
    }

    // __________________________
    public function isError() {
        return $this->pdoDBhandle == false;
    }

    // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
    // encrypts password to introduce a very private way (salt)
    protected function encryptPassword($password) {
        return sha1('t' . $password);
    }

    // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
    protected function refreshAdmintoken($token) {
        $sql_update = $this->pdoDBhandle->prepare(
            'UPDATE admintokens
                SET valid_until =:value
                WHERE id =:token');

        if ($sql_update != false) {
            $sql_update->execute(array(
                ':value' => date('Y-m-d H:i:s', time() + $this->idletime),
                ':token'=> $token));
        }
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // returns true if the user with given (valid) token is superadmin
    public function isSuperAdmin($token) {
        $myreturn = false;
        if (($this->pdoDBhandle != false) and (strlen($token) > 0)) {
            $sql = $this->pdoDBhandle->prepare(
                'SELECT users.is_superadmin FROM users
                    INNER JOIN admintokens ON users.id = admintokens.user_id
                    WHERE admintokens.id=:token');
    
            if ($sql != false) {
                if ($sql -> execute(array(
                    ':token' => $token))) {

                    $first = $sql -> fetch(PDO::FETCH_ASSOC);
                    if ($first != false) {
                        $this->refreshAdmintoken($token);
                        $myreturn = ($first['is_superadmin'] == true);
                    }
                }
            }
        }
        return $myreturn;
    }

}

?>