<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// all functions require the auth check to be done before!
// i. e. call isSuperAdmin() from DBConnection

require_once('DBConnection.php');

class DBConnectionSuperAdmin extends DBConnection {

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function getWorkspaces() {
        $myreturn = []; // id, name
        $sql = $this->pdoDBhandle->prepare(
            'SELECT workspaces.id, workspaces.name FROM workspaces ORDER BY workspaces.name');
    
        if ($sql -> execute()) {
            $data = $sql->fetchAll(PDO::FETCH_ASSOC);
            if ($data != false) {
                $myreturn = $data;
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function getUsers() {
        $myreturn = []; // name, id, email, is_superadmin
        $sql = $this->pdoDBhandle->prepare(
            'SELECT users.name, users.id, users.email, users.is_superadmin FROM users ORDER BY users.name');
    
        if ($sql -> execute()) {
            $data = $sql->fetchAll(PDO::FETCH_ASSOC);
            if ($data != false) {
                $myreturn = $data;
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function getWorkspacesByUser($username) {
        $myreturn = []; // id, name, selected
        $sql = $this->pdoDBhandle->prepare(
            'SELECT workspace_users.workspace_id as id, workspace_users.role as role  FROM workspace_users
                INNER JOIN users ON users.id = workspace_users.user_id
                WHERE users.name=:user_name');
    
        if ($sql -> execute(array(
            ':user_name' => $username))) {

            $userworkspaces = $sql->fetchAll(PDO::FETCH_ASSOC);
            $workspaceIdList = [];
            if ($userworkspaces != false) {
                foreach ($userworkspaces as $userworkspace) {
                    $workspaceIdList[$userworkspace['id']] = $userworkspace['role'];
                }
            }

            $sql = $this->pdoDBhandle->prepare(
                'SELECT workspaces.id, workspaces.name FROM workspaces ORDER BY workspaces.name');
        
            if ($sql -> execute()) {
                $allworkspaces = $sql->fetchAll(PDO::FETCH_ASSOC);
                if ($allworkspaces != false) {
                    foreach ($allworkspaces as $workspace) {
                        array_push($myreturn, [
                            'id' => $workspace['id'],
                            'name' => $workspace['name'],
                            'selected' => isset($workspaceIdList[$workspace['id']]),
                            'role' => isset($workspaceIdList[$workspace['id']]) ? $workspaceIdList[$workspace['id']] : ''
                        ]);
                    }
                }
            }
        }
        return $myreturn;
    }


    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function setWorkspacesByUser($username, $workspaces) { // $workspaces is list of id and role
        $myreturn = false;
        $sql = $this->pdoDBhandle->prepare(
            'SELECT users.id FROM users
                WHERE users.name=:user_name');
        if ($sql -> execute(array(
            ':user_name' => $username))) {
            $data = $sql -> fetch(PDO::FETCH_ASSOC);
            if ($data != false) {
                $userid = $data['id'];
                $sql = $this->pdoDBhandle->prepare(
                    'DELETE FROM workspace_users
                        WHERE workspace_users.user_id=:user_id');
            
                if ($sql -> execute(array(
                    ':user_id' => $userid))) {

                    $sql_insert = $this->pdoDBhandle->prepare(
                        'INSERT INTO workspace_users (workspace_id, user_id, role) 
                            VALUES(:workspaceId, :userId, :role)');
                    foreach($workspaces as $userworkspace) {
                        if (strlen($userworkspace->role) > 0) {
                            $sql_insert->execute(array(
                                    ':workspaceId' => $userworkspace->id,
                                    ':role' => $userworkspace->role,
                                    ':userId' => $userid));
                        }
                    }
                    $myreturn = true;
                }
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function setPassword($username, $password) {
        $myreturn = false;
        $sql = $this->pdoDBhandle->prepare(
            'UPDATE users SET password = :password WHERE name = :user_name');
        if ($sql -> execute(array(
            ':user_name' => $username,
            ':password' => $this->encryptPassword($password)))) {
            $myreturn = true;
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function addUser($username, $password) {
        $myreturn = false;
        $sql = $this->pdoDBhandle->prepare(
            'SELECT users.name FROM users
                WHERE users.name=:user_name');
            
        if ($sql -> execute(array(
            ':user_name' => $username))) {
                
            $data = $sql -> fetch(PDO::FETCH_ASSOC);
            if ($data == false) {
                $sql = $this->pdoDBhandle->prepare(
                    'INSERT INTO users (name, password) VALUES (:user_name, :user_password)');
                    
                if ($sql -> execute(array(
                    ':user_name' => $username,
                    ':user_password' => $this->encryptPassword($password)))) {
                        
                    $myreturn = true;
                }
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function deleteUsers($usernames) {
        $myreturn = false;
        $sql = $this->pdoDBhandle->prepare(
            'DELETE FROM users
                WHERE users.name = :user_name');
    
        $myreturn = true;
        foreach ($usernames as $username) {
            if (!$sql->execute(array(
                    ':user_name' => $username))) {
                $myreturn = false;
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function addWorkspace($name) {
        $myreturn = false;
        $sql = $this->pdoDBhandle->prepare(
            'SELECT workspaces.id FROM workspaces 
                WHERE workspaces.name=:ws_name');
            
        if ($sql -> execute(array(
            ':ws_name' => $name))) {
                
            $data = $sql -> fetch(PDO::FETCH_ASSOC);
            if ($data == false) {
                $sql = $this->pdoDBhandle->prepare(
                    'INSERT INTO workspaces (name) VALUES (:ws_name)');
                    
                if ($sql -> execute(array(
                    ':ws_name' => $name))) {
                        
                    $myreturn = true;
                }
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function renameWorkspace($wsId, $newname) { // todo RAISE ERROR IS WS_ID WAS NOT EXISTANT
        $myreturn = false;
        if (($wsId > 0) && (strlen($newname) > 0)) {
            $sql = $this->pdoDBhandle->prepare(
                'UPDATE workspaces SET name = :name WHERE id = :id');
            if ($sql -> execute(array(
                ':name' => $newname,
                ':id' => $wsId))) {
                $myreturn = true;

            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function deleteWorkspaces($wsIds) {
        $myreturn = false;
        $sql = $this->pdoDBhandle->prepare(
            'DELETE FROM workspaces
                WHERE workspaces.id = :ws_id');
    
        $myreturn = true;
        foreach ($wsIds as $wsId) {
            if (!$sql->execute(array(
                    ':ws_id' => $wsId))) {
                $myreturn = false;
            }
        }
        return $myreturn;
    }


    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function getUsersByWorkspace($wsId) {
        $myreturn = []; // id, name, selected
        $sql = $this->pdoDBhandle->prepare(
            'SELECT workspace_users.user_id as id, workspace_users.role as role FROM workspace_users
                WHERE workspace_users.workspace_id=:ws_id');
    
        if ($sql -> execute(array(
            ':ws_id' => $wsId))) {

            $workspaceusers = $sql->fetchAll(PDO::FETCH_ASSOC);
            $userList = [];
            if ($workspaceusers != false) {
                foreach ($workspaceusers as $workspaceuser) {
                    $userList[$workspaceuser['id']] = $workspaceuser['role'];
                }
            }

            $sql = $this->pdoDBhandle->prepare(
                'SELECT users.id, users.name FROM users ORDER BY users.name');
        
            if ($sql -> execute()) {
                $allusers = $sql->fetchAll(PDO::FETCH_ASSOC);
                if ($allusers != false) {
                    foreach ($allusers as $user) {
                        array_push($myreturn, [
                            'id' => $user['id'],
                            'name' => $user['name'],
                            'selected' => isset($userList[$user['id']]),
                            'role' => isset($userList[$user['id']]) ? $userList[$user['id']] : '',
                        ]);
                    }
                }
            }
        }
        return $myreturn;
    }


    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function setUsersByWorkspace($wsId, $users) { // users: id and role
        $myreturn = false;
        $sql = $this->pdoDBhandle->prepare(
            'DELETE FROM workspace_users
                WHERE workspace_users.workspace_id=:ws_id');
    
        if ($sql -> execute(array(
            ':ws_id' => $wsId))) {

            $sql_insert = $this->pdoDBhandle->prepare(
                'INSERT INTO workspace_users (workspace_id, user_id, role) 
                    VALUES(:workspaceId, :userId, :role)');
            $myreturn = true;
            foreach ($users as $workspaceuser) {
                if (strlen($workspaceuser->role) > 0) {
                    if (!$sql_insert->execute(array(
                            ':workspaceId' => $wsId,
                            ':role' => $workspaceuser->role,
                            ':userId' => $workspaceuser->id))) {
                        $myreturn = false;
                    }
                }
            }
        }
        return $myreturn;
    }
    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /

}
?>
