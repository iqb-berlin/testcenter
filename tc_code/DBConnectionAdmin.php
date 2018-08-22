<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

require_once('DBConnection.php');

class DBConnectionAdmin extends DBConnection {
    protected $idletime =  60 * 30;
    // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
    // sets the valid_until of the token to now + idle
    private function refreshToken($token) {
        $sql_update = $this->pdoDBhandle->prepare(
            'UPDATE admintokens
                SET valid_until =:value
                WHERE id =:token');

        $sql_update->execute(array(
            ':value' => date('Y/m/d h:i:s a', time() + $this->idletime),
            ':token'=> $token));
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // deletes all tokens of this user if any and creates new token
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
                    // first: delete all tokens of this user if any
                    $sql_delete = $this->pdoDBhandle->prepare(
                        'DELETE FROM admintokens 
                            WHERE admintokens.user_id = :id');

                    $sql_delete -> execute(array(
                        ':id' => $selector['id']
                    ));

                    // create new token
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
    // deletes all tokens of this user
    public function logout($token) {
        if (($this->pdoDBhandle != false) and (strlen($token) > 0)) {
            $sql = $this->pdoDBhandle->prepare(
                'DELETE FROM admintokens 
                    WHERE admintokens.id=:token');

            $sql -> execute(array(
                ':token'=> $token));
        }
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // returns the name of the user with given (valid) token
    // returns '' if token not found or not valid
    // refreshes token
    public function getLoginName($token) {
        $myreturn = '';
        if (($this->pdoDBhandle != false) and (strlen($token) > 0)) {
            $sql = $this->pdoDBhandle->prepare(
                'SELECT users.name FROM users
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


    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // returns all booklets stored in the database (i. e. already answered) for the given workspace
    public function getBookletList($workspace_id) {
        $myreturn = [];
        if ($this->pdoDBhandle != false) {

            $sql = $this->pdoDBhandle->prepare(
                'SELECT booklets.name, booklets.laststate, booklets.locked FROM booklets
                    INNER JOIN sessions ON booklets.session_id = sessions.id
                    INNER JOIN logins ON sessions.login_id = logins.id
                    INNER JOIN workspaces ON logins.workspace_id = workspaces.id
                    WHERE workspaces.id=:workspace_id');
                
            if ($sql -> execute(array(
                ':workspace_id' => $workspace_id))) {
                    
                    $myreturn = $sql -> fetchAll(PDO::FETCH_ASSOC);
            }
        }
            
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // returns all workspaces for the user associated with the given token
    // returns [] if token not valid or no workspaces 
    public function getWorkspaces($token) {
        $myreturn = [];
        if (($this->pdoDBhandle != false) and (strlen($token) > 0)) {
            $sql = $this->pdoDBhandle->prepare(
                'SELECT workspaces.id, workspaces.name FROM workspaces
                    INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
                    INNER JOIN users ON workspace_users.user_id = users.id
                    INNER JOIN admintokens ON  users.id = admintokens.user_id
                    WHERE admintokens.id =:token');
        
            if ($sql -> execute(array(
                ':token' => $token))) {

                $data = $sql->fetchAll(PDO::FETCH_ASSOC);
                if ($data != false) {
                    $this->refreshToken($token);
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

    public function hasAdminAccessToWorkspace($token, $requestedWorkspaceId) {
        $authorized = false;
        foreach($this->getWorkspaces($token) as $allowedWorkspace) {

            if ($allowedWorkspace['id'] == $requestedWorkspaceId) {
                $authorized = true;
            }
        }
        return $authorized;
    }   

    public function showStats($adminToken, $workspaceId) {
            
        $obj = [
            [name => 'Group Rocket', testsTotal => 12, testsStarted => 20, responsesGiven => 30],
            [name => 'Group Helium', testsTotal => 42, testsStarted =>  20, responsesGiven => 30],
            [name => 'Group Hydrogen', testsTotal => 12, testsStarted => 20, responsesGiven => 50],
            [name => 'Group Helium', testsTotal => 42, testsStarted =>  20, responsesGiven => 30],
            [name => 'Group Hydrogen', testsTotal => 12, testsStarted => 20, responsesGiven => 30],
            [name => 'Group Helium', testsTotal => 42, testsStarted =>  20, responsesGiven => 30],
            [name => 'Group Hydrogen', testsTotal => 12, testsStarted => 20, responsesGiven => 30],
            [name => $adminToken, testsTotal => 42, testsStarted => $workspaceId, responsesGiven => 30]
        ];
    
        return $obj;
 
    }

    public function testsStarted($adminToken, $workspaceId) {
        if (($this->pdoDBhandle != false) and (strlen($workspaceId) > 0)) {
            $sql = $this->pdoDBhandle->prepare(
                'SELECT logins.name, sessions.code, booklets.name as booklet
                    FROM booklets
                    INNER JOIN sessions ON sessions.id = booklets.session_id
                    INNER JOIN logins ON logins.id = sessions.login_id
                    INNER JOIN workspaces ON workspaces.id = logins.workspace_id
                    WHERE logins.workspace_id =:workspaceId');
        
            if ($sql -> execute(array(
                ':workspaceId' => $workspaceId))) {

                $data = $sql->fetchAll(PDO::FETCH_ASSOC);
                if ($data != false) {
                    $this->refreshToken($token);
                    $obj = $data;
                }
            }
        }
        return $obj;
    }

    public function responsesGiven($workspaceId) {
        if (($this->pdoDBhandle != false) and (strlen($workspaceId) > 0)) {
            $sql = $this->pdoDBhandle->prepare(
                'SELECT DISTINCT logins.name, sessions.code, booklets.name as booklet, units.name as unit
                FROM booklets
                INNER JOIN sessions ON sessions.id = booklets.session_id
                INNER JOIN logins ON logins.id = sessions.login_id
                INNER JOIN workspaces ON workspaces.id = logins.workspace_id
                INNER JOIN units ON units.booklet_id = booklets.id
                WHERE workspace_id =:workspaceId');
        
            if ($sql -> execute(array(
                ':workspaceId' => $workspaceId))) {

                $data = $sql->fetchAll(PDO::FETCH_ASSOC);
                if ($data != false) {
                    $this->refreshToken($token);
                    $obj = $data;
                }
            }
        }
        return $obj;
    }


    public function groupName($wsId) {
        if(is_numeric($wsId)) {
          if($wsId > 0) {
            $sanitizedwsId = intval($wsId);
    
            $TesttakersDirname = __DIR__.'/../tc_data/ws_' . $sanitizedwsId . '/Testtakers';
            error_log($TesttakersDirname);
            if (file_exists($TesttakersDirname)) {
    
              $testTakersDirectoryHandle = opendir($TesttakersDirname);
    
              // reading file by file, $filename stores the name of the next file in the directory
              while (($filename = readdir($testTakersDirectoryHandle))) { 
    
                  // checking if files still exist ahead  
                  if ($filename !== false) {             
    
                    $fullfilename = $TesttakersDirname . '/' . $filename; // complete file path
                    
                      // checking if there is a file at the full file path and if it is an .xml
                      if (is_file($fullfilename) && (strtoupper(substr($filename, -4)) == '.XML')) {
                        $xmlfile = simplexml_load_file($fullfilename);
                        
                        // if the xml file has loaded successfully into $xmlfile
                        if ($xmlfile != false) {
    
                          $rootTagName = $xmlfile->getName();
                          if ($rootTagName == 'Testtakers') {
    
                            // go through each xml tag that is a direct child of <Testtakers>
                            foreach($xmlfile->children() as $directChildOfTesttakers) { 
                              if ($directChildOfTesttakers->getName() == 'Group') {
                                foreach($directChildOfTesttakers->attributes() as $a => $b) {
                                    if($a === "name") {
                                        $obj[] = $b;
                                    }
                                }
                                // $obj["name"] = $groupName;
                                // foreach( as $loginName) {
    
                                //     // for each test taker increment number of registered users
                                //     if($loginName->getName() == 'Login') {
    
                                //         $allCodesBelongingToALogin = array();
                                //         foreach($loginName->children() as $booklet) {
                                //           foreach($booklet->attributes() as $bookletAttributeName => $bookletAttributeValue) {
                                //             // print_r($bookletAttributeName);
    
                                //             if($bookletAttributeName == 'codes') {
                                //               $codesBelongingToBooklet = $bookletAttributeValue->__toString();
                                //               $codesBelongingToBookletAsArray = explode(" ", $codesBelongingToBooklet);
    
                                //               foreach ($codesBelongingToBookletAsArray as $key => $value) {
                                //                 if(in_array($value, $allCodesBelongingToALogin)===false) {
                                //                   array_push($allCodesBelongingToALogin, $value);
                                //                 }  
                                //               }
                                //             }
                                //           }
                                //         }
                                //         $loginNameAttributeValue = $loginName->attributes()->name->__toString(); 
    
                                //         $c = array();
    
                                //         $c['name'] = $loginNameAttributeValue;
                                //         $c['codes'] = $allCodesBelongingToALogin;
                                        
                                //         array_push($return, $c);
                                //     }
                                //   }
                              }
                            }
                          }
                        } else { 
                          error_log('Error: There was no file found!');
                        }
                      } else { 
                        error_log('Error: There might not be a file there or it is not of .xml format!');
                      }
                  } else {
                    break;
                    // if there are no more files in the folder then exit the while loop
                  }
              }
            } else { 
              error_log('Error: Folder does not exist!');
            }
          } else {
            error_log('Error: Workspace ID is not valid / Might not be a number!');
          }
        } else {
          error_log('Error: Workspace ID is not a number');
        }
        return $obj;
      }

    public function fetchStatsfromDB($wsId) {

    }
    



/******************HELPER FUNCTIONS*************/

/* Helpful SQL queries*/

// 1. see name, code, laststate

// SELECT logins.name, sessions.code, booklets.name
// FROM booklets
// INNER JOIN sessions ON sessions.id = booklets.session_id
// INNER JOIN logins ON logins.id = sessions.login_id
// INNER JOIN workspaces ON workspaces.id = logins.workspace_id
// WHERE workspace_id =:wsId

// 2. see DISTINCT record of name, code, booklet, unit

// SELECT DISTINCT logins.name, sessions.code, booklets.name, units.name
// FROM booklets
// INNER JOIN sessions ON sessions.id = booklets.session_id
// INNER JOIN logins ON logins.id = sessions.login_id
// INNER JOIN workspaces ON workspaces.id = logins.workspace_id
// INNER JOIN units ON units.booklet_id = booklets.id
// WHERE workspace_id =:wsId

// 3. count booklets started

// SELECT COUNT(*)
// FROM sessions
// INNER JOIN logins ON sessions.login_id = logins.id
// WHERE workspace_id =:wsId


}
?>