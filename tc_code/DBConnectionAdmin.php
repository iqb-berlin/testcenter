<?php

require_once('DBConnection.php');

class DBConnectionAdmin extends DBConnection {
    private $idletime = 60 * 30;

    // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
    private function refreshToken($token) {
        /*
        $sql_update = $this->pdoDBhandle->prepare(
            'UPDATE admintokens
                SET valid_until =:value
                WHERE id =:token');

        $sql_update->execute(array(
            ':value' => time() + $this->idletime, PDO::PARAM_STR,
            ':token'=> $token));
            */
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function login($username, $password) {
        $myreturn = '';

        if (($this->pdoDBhandle != false) and (strlen($username) > 0) and (strlen($username) < 50) 
                        and (strlen($password) > 0) and (strlen($password) < 50)) {
            $passwort_sha = sha1($password);
            $sql_select = $this->pdoDBhandle->prepare(
                'SELECT * FROM users
                    WHERE users.name = :name AND users.password = :password');
                
            if ($sql_select->execute(array(
                ':name' => $username, 
                ':password' => $passwort_sha))) {

                $selector = $sql_select->fetch(PDO::FETCH_ASSOC);
                if ($selector != false) {
                    $sql_delete = $this->pdoDBhandle->prepare(
                        'DELETE FROM admintokens 
                            WHERE admintokens.user_id = :id');

                    $sql_delete -> execute(array(
                        ':id' => $selector['id']
                    ));

                    $myreturn = uniqid('a', true);
                    
                    $sql_insert = $this->pdoDBhandle->prepare(
                        'INSERT INTO admintokens (id, user_id, valid_until) 
                            VALUES(:id, :user_id, :valid_until)');

                    if (!$sql_insert->execute(array(
                        ':id' => $myreturn,
                        ':user_id' => $selector['id'],
                        ':valid_until' => date('Y-m-d G:i:s', time() + $this->idletime)))) {

                        $myreturn = '';
                    }
                }
            }
        }
        return $myreturn;
    }
    
    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function logout($token) {
        $sql = $this->pdoDBhandle->prepare(
            'DELETE FROM admintokens 
                WHERE admintokens.id=:token');

        $sql -> execute(array(
            ':token'=> $token));
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function getBookletList($workspace_id) {
        $sql = $this->pdoDBhandle->prepare(
            'SELECT booklets.name, booklets.laststate, booklets.locked 
                FROM booklets
                INNER JOIN sessions ON booklets.session_id = sessions.id
                INNER JOIN logins ON sessions.login_id = logins.id
                INNER JOIN workspaces ON logins.workspace_id = workspaces.id
                WHERE workspaces.id=:workspace_id');
             
        $sql -> execute(array(
            ':workspace_id' => $workspace_id));

        
        return $sql -> fetchAll(PDO::FETCH_ASSOC);
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function getWorkspaces($token) {
        $myreturn = [];
        $sql = $this->pdoDBhandle->prepare(
            'SELECT workspaces.id, workspaces.name FROM workspaces
                INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
                INNER JOIN users ON workspace_users.user_id = users.id
                INNER JOIN admintokens ON  users.id = admintokens.user_id
                WHERE admintokens.id =:token');
    
        $sql -> execute(array(
            ':token' => $token
        ));
        $myreturn = $sql->fetchAll(PDO::FETCH_ASSOC);

        if ($myreturn != false) {
            $this->refreshToken($token);
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function getLoginName($token) {
        $myreturn = '';
        if ($this->pdoDBhandle != false) {
            $sql = $this->pdoDBhandle->prepare(
                'SELECT users.name
                    FROM users
                    INNER JOIN admintokens ON users.id = admintokens.user_id
                    WHERE admintokens.id=:token');
    
            $sql -> execute(array(
                ':token' => $token
            ));

            $first = $sql -> fetch(PDO::FETCH_ASSOC);
    
            if ($first != false) {
                $this->refreshToken($token);
                $myreturn = $first['name'];
            }
        }
        return $myreturn;
    }
}
?>