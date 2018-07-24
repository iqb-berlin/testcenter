<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

require_once('DBConnection.php');

class DBConnectionSuperAdmin extends DBConnection {

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // returns all workspaces if the user associated with the given token is superadmin
    // returns [] if token not valid or no workspaces 
    // token is refreshed via isSuperAdmin
    public function getWorkspaces($token) {
        $myreturn = [];
        if ($this->isSuperAdmin($token)) {
            $sql = $this->pdoDBhandle->prepare(
                'SELECT workspaces.id as id, workspaces.name as label FROM workspaces ORDER BY workspaces.name');
        
            if ($sql -> execute()) {

                $data = $sql->fetchAll(PDO::FETCH_ASSOC);
                if ($data != false) {
                    $myreturn = $data;
                }
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // returns the name of the workspace given by id
    // returns '' if not found
    // token is not refreshed
    public function getWorkspaceName($workspace_id) {
        $myreturn = '';
        if ($this->pdoDBhandle != false) {

            $sql = $this->pdoDBhandle->prepare(
                'SELECT workspaces.name FROM workspaces
                    WHERE workspaces.id=:workspace_id');
                
            if ($sql -> execute(array(
                ':workspace_id' => $workspace_id))) {
                    
                $data = $sql -> fetch(PDO::FETCH_ASSOC);
                if ($data != false) {
                    $myreturn = $data['name'];
                }
            }
        }
            
        return $myreturn;
    }


    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // returns all users if the user associated with the given token is superadmin
    // returns [] if token not valid or no users 
    // token is refreshed via isSuperAdmin
    public function getUsers($token) {
        $myreturn = [];
        if ($this->isSuperAdmin($token)) {
            $sql = $this->pdoDBhandle->prepare(
                'SELECT users.name FROM users ORDER BY users.name');
        
            if ($sql -> execute()) {
                $data = $sql->fetchAll(PDO::FETCH_ASSOC);
                if ($data != false) {
                    $myreturn = $data;
                }
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // returns all workspaces with a flag whether the given user has access to it
    // returns [] if token not valid or user not found
    // token is refreshed via isSuperAdmin
    public function getWorkspacesByUser($token, $username) {
        $myreturn = [];
        if ($this->isSuperAdmin($token)) {
            $sql = $this->pdoDBhandle->prepare(
                'SELECT workspace_users.workspace_id as id FROM workspace_users
                    INNER JOIN users ON users.id = workspace_users.user_id
                    WHERE users.name=:user_name');
        
            if ($sql -> execute(array(
                ':user_name' => $username))) {

                $userworkspaces = $sql->fetchAll(PDO::FETCH_ASSOC);
                $workspaceIdList = [];
                if ($userworkspaces != false) {
                    foreach ($userworkspaces as $userworkspace) {
                        array_push($workspaceIdList, $userworkspace['id']);
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
                                'label' => $workspace['name'],
                                'selected' => in_array($workspace['id'], $workspaceIdList)]);
                        }
                    }
                }
            }
        }
        return $myreturn;
    }


    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // sets workspaces to the given user to give access to it
    // returns false if token not valid or user not found
    // token is refreshed via isSuperAdmin
    public function setWorkspacesByUser($token, $username, $workspaces) {
        $myreturn = false;
        if ($this->isSuperAdmin($token)) {
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
                            'INSERT INTO workspace_users (workspace_id, user_id) 
                                VALUES(:workspaceId, :userId)');
                        foreach ($workspaces as $userworkspace) {
                            if ($userworkspace['selected']) {
                                $sql_insert->execute(array(
                                        ':workspaceId' => $userworkspace['id'],
                                        ':userId' => $userid));
                            }
                        }
                        $myreturn = true;
                    }
                }
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // sets password of the given user
    // returns false if token not valid or user not found
    // token is refreshed via isSuperAdmin
    public function setPassword($token, $username, $password) {
        $myreturn = false;
        if ($this->isSuperAdmin($token)) {
            $sql = $this->pdoDBhandle->prepare(
                'UPDATE users SET password = :password WHERE name = :user_name');
            if ($sql -> execute(array(
                ':user_name' => $username,
                ':password' => $this->encryptPassword($password)))) {
                $myreturn = true;
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // adds new user if no user with the given name exists
    // returns true if ok, false if admin-token not valid or user already exists
    // token is refreshed via isSuperAdmin
    public function addUser($token, $username, $password) {
        $myreturn = false;
        if ($this->isSuperAdmin($token)) {

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
        }
            
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // deletes users
    // returns false if token not valid or any delete action failed
    // token is refreshed via isSuperAdmin
    public function deleteUsers($token, $usernames) {
        $myreturn = false;
        if ($this->isSuperAdmin($token)) {
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
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function addWorkspace($token, $name) {
        $myreturn = false;
        if ($this->isSuperAdmin($token)) {

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
        }
            
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function setWorkspace($token, $wsid, $name) {
        $myreturn = false;
        if ($this->isSuperAdmin($token)) {
            $sql = $this->pdoDBhandle->prepare(
                'UPDATE workspaces SET name = :name WHERE id = :id');
            if ($sql -> execute(array(
                ':name' => $name,
                ':id' => $wsid))) {
                $myreturn = true;
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function deleteWorkspaces($token, $wsIds) {
        $myreturn = false;
        if ($this->isSuperAdmin($token)) {
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
        }
        return $myreturn;
    }


    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function getUsersByWorkspace($token, $wsId) {
        $myreturn = [];
        if ($this->isSuperAdmin($token)) {
            $sql = $this->pdoDBhandle->prepare(
                'SELECT workspace_users.user_id as id FROM workspace_users
                    WHERE workspace_users.workspace_id=:ws_id');
        
            if ($sql -> execute(array(
                ':ws_id' => $wsId))) {

                $workspaceusers = $sql->fetchAll(PDO::FETCH_ASSOC);
                $userIdList = [];
                if ($workspaceusers != false) {
                    foreach ($workspaceusers as $workspaceuser) {
                        array_push($userIdList, $workspaceuser['id']);
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
                                'label' => $user['name'],
                                'selected' => in_array($user['id'], $userIdList)]);
                        }
                    }
                }
            }
        }
        return $myreturn;
    }


    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function setUsersByWorkspace($token, $wsId, $users) {
        $myreturn = false;
        if ($this->isSuperAdmin($token)) {

            $sql = $this->pdoDBhandle->prepare(
                'DELETE FROM workspace_users
                    WHERE workspace_users.workspace_id=:ws_id');
        
            if ($sql -> execute(array(
                ':ws_id' => $wsId))) {

                $sql_insert = $this->pdoDBhandle->prepare(
                    'INSERT INTO workspace_users (workspace_id, user_id) 
                        VALUES(:workspaceId, :userId)');
                $myreturn = true;
                foreach ($users as $workspaceuser) {
                    if ($workspaceuser['selected']) {
                        if (!$sql_insert->execute(array(
                                ':workspaceId' => $wsId,
                                ':userId' => $workspaceuser['id']))) {
                            $myreturn = false;
                        }
                    }
                }
            }
        }
        return $myreturn;
    }
    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /

}
?>