<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

require_once('DBConnection.php');

class DBConnectionTC extends DBConnection {
    private $idletimeSession = 60 * 30;

    // for all functions here: $persontoken is the token as stored in the
    // database; the sessiontoken given to other functions and used by the 
    // client is a  combination of sessiontoken (db) + booklet-DB-id

    // __________________________
    public function canWriteBookletData($persontoken, $bookletDbId) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $booklet_select = $this->pdoDBhandle->prepare(
                'SELECT booklets.locked FROM booklets
                    INNER JOIN persons ON persons.id = booklets.person_id
                    WHERE persons.token=:token and booklets.id=:bookletId');
                
            if ($booklet_select->execute(array(
                ':token' => $persontoken,
                ':bookletId' => $bookletDbId
                ))) {

                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                if ($bookletdata !== false) {
                    if ($bookletdata['locked'] !== 't') {
                        $myreturn = true;
                    }
                }
            }
        }
        return $myreturn;
    }

    public function getBookletId($auth) {
        $myreturn = 0;

        if (isset($auth)) {
            if (is_string($auth)) {
                if (strlen($auth) > 0) {
                    $tokensplits = explode('##', $auth);
                    if (count($tokensplits) == 2) {
                        $persontoken = $tokensplits[0];
                        $bookletDbId = $tokensplits[1];
                        if ((strlen($persontoken) > 0) and (strlen($bookletDbId) > 0) and is_numeric($bookletDbId)) {
                            $myreturn = intval($bookletDbId);
                        }}}}}

        return $myreturn;
    }

    public function authOk($auth, $RW = false) {
        $myreturn = false;

        if (isset($auth)) {
            if (is_string($auth)) {
                if (strlen($auth) > 0) {
                    $tokensplits = explode('##', $auth);
                    if (count($tokensplits) == 2) {
                        $persontoken = $tokensplits[0];
                        $bookletDbId = $tokensplits[1];
                        if ((strlen($persontoken) > 0) and (strlen($bookletDbId) > 0) and is_numeric($bookletDbId)) {

                            // 6666666666666666666666
                            $booklet_select = $this->pdoDBhandle->prepare(
                                'SELECT booklets.locked FROM booklets
                                    INNER JOIN persons ON persons.id = booklets.person_id
                                    WHERE persons.token=:token and booklets.id=:bookletId');
                                
                            if ($booklet_select->execute(array(
                                ':token' => $persontoken,
                                ':bookletId' => $bookletDbId
                                ))) {
                
                                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                                if ($bookletdata !== false) {
                                    $myreturn = ($RW === false) || ($bookletdata['locked'] !== 't');
                                }
                            }
                
                        }
                    }
                }
            }
            
        }
        return $myreturn;
    }

    public function addBookletReview($bookletDbId, $priority, $categories, $entry) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            if (is_numeric($priority)) {
                $priority = intval($priority);
                if (($priority <= 0) or ($priority > 3)) {
                    $priority = 0;
                }
            } else {
                $priority = 0;
            }

            $bookletreview_insert = $this->pdoDBhandle->prepare(
                'INSERT INTO bookletreviews (booklet_id, reviewtime, reviewer, priority, categories, entry) 
                    VALUES(:b, :t, :r, :p, :c, :e)');

            if ($bookletreview_insert->execute(array(
                ':b' => $bookletDbId,
                ':t' => date('Y-m-d H:i:s', time()),
                ':r' => '-',
                ':p' => $priority,
                ':c' => $categories,
                ':e' => $entry
                ))) {
                    $myreturn = true;
            }
        }
        return $myreturn;
    }

    // __________________________
    public function addUnitReview($bookletDbId, $unit, $priority, $categories, $entry) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            if (is_numeric($priority)) {
                $priority = intval($priority);
                if (($priority <= 0) or ($priority > 3)) {
                    $priority = 0;
                }
            } else {
                $priority = 0;
            }

            $unit_select = $this->pdoDBhandle->prepare(
                'SELECT units.id FROM units
                    WHERE units.name=:name and units.booklet_id=:bookletId');
                
            if ($unit_select->execute(array(
                ':name' => $unit,
                ':bookletId' => $bookletDbId
                ))) {

                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                if ($unitdata !== false) {
                    $unitreview_insert = $this->pdoDBhandle->prepare(
                        'INSERT INTO unitreviews (unit_id, reviewtime, reviewer, priority, categories, entry) 
                            VALUES(:u, :t, :r, :p, :c, :e)');

                    if ($unitreview_insert->execute(array(
                        ':u' => $unitdata['id'],
                        ':t' => date('Y-m-d H:i:s', time()),
                        ':r' => '-',
                        ':p' => $priority,
                        ':c' => $categories,
                        ':e' => $entry
                        ))) {
                            $myreturn = true;
            }}}
        }
        return $myreturn;
    }

    // __________________________
    public function getWorkspaceByLogintoken($logintoken) {
        $myreturn = 0;
        if ($this->pdoDBhandle != false) {
            $login_select = $this->pdoDBhandle->prepare(
                'SELECT logins.workspace_id FROM logins
                    WHERE logins.token=:token');
                
            if ($login_select->execute(array(
                ':token' => $logintoken
                ))) {

                $logindata = $login_select->fetch(PDO::FETCH_ASSOC);
                if ($logindata !== false) {
                    $myreturn = 0 + $logindata['workspace_id'];
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    
    public function getWorkspaceByPersonToken($persontoken) {
        $myreturn = 0;

        if (strlen($persontoken) > 0) {
               
            $person_select = $this->pdoDBhandle->prepare(
                'SELECT logins.workspace_id FROM persons
                    INNER JOIN logins ON logins.id = persons.login_id
                    WHERE persons.token=:token');
            if ($person_select->execute(array(
                ':token' => $persontoken
                ))) {

                $persondata = $person_select->fetch(PDO::FETCH_ASSOC);
                if ($persondata !== false) {
                    $myreturn = $persondata['workspace_id'];
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getWorkspaceByAuth($auth) {
        $myreturn = 0;

        if (isset($auth)) {
            if (is_string($auth)) {
                if (strlen($auth) > 0) {
                    $tokensplits = explode('##', $auth);
                    if (count($tokensplits) == 2) {
                        $persontoken = $tokensplits[0];
                        // $bookletDbId = $tokensplits[1];
                        // if ((strlen($persontoken) > 0) and (strlen($bookletDbId) > 0) and is_numeric($bookletDbId)) {
                        if (strlen($persontoken) > 0) {

                            // 6666666666666666666666
                            // $person_select = $this->pdoDBhandle->prepare(
                            //     'SELECT logins.workspace_id FROM booklets
                            //         INNER JOIN persons ON persons.id = booklets.person_id
                            //         INNER JOIN logins ON logins.id = persons.login_id
                            //         WHERE persons.token=:token and booklets.id=:bookletId');
                                
                            $person_select = $this->pdoDBhandle->prepare(
                                'SELECT logins.workspace_id FROM persons
                                    INNER JOIN logins ON logins.id = persons.login_id
                                    WHERE persons.token=:token');
                            if ($person_select->execute(array(
                                ':token' => $persontoken
                                ))) {
                
                                $persondata = $person_select->fetch(PDO::FETCH_ASSOC);
                                if ($persondata !== false) {
                                    $myreturn = $persondata['workspace_id'];
                                }
                            }
                
                        }
                    }
                }
            }
            
        }
        return $myreturn;
    }
    
    // __________________________
    public function getBookletNameByAuth($auth) {
        $myreturn = '';

        if (isset($auth)) {
            if (is_string($auth)) {
                if (strlen($auth) > 0) {
                    $tokensplits = explode('##', $auth);
                    if (count($tokensplits) == 2) {
                        $persontoken = $tokensplits[0];
                        $bookletDbId = $tokensplits[1];
                        if ((strlen($persontoken) > 0) and (strlen($bookletDbId) > 0) and is_numeric($bookletDbId)) {

                            // 6666666666666666666666
                            $booklet_select = $this->pdoDBhandle->prepare(
                                'SELECT booklets.name FROM booklets
                                    INNER JOIN persons ON persons.id = booklets.person_id
                                    WHERE persons.token=:token and booklets.id=:bookletId');
                                
                            if ($booklet_select->execute(array(
                                ':token' => $persontoken,
                                ':bookletId' => $bookletDbId
                                ))) {
                
                                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                                if ($bookletdata !== false) {
                                    $myreturn = $bookletdata['name'];
                                }
                            }
                
                        }
                    }
                }
            }
            
        }
        return $myreturn;
    }
    
    // __________________________
    public function getBookletStatus($bookletDbId) {
        $myreturn = [];
        if ($this->pdoDBhandle != false) {
            $booklet_select = $this->pdoDBhandle->prepare(
                'SELECT booklets.locked, booklets.laststate FROM booklets
                    WHERE booklets.id=:bookletId');
                
            if ($booklet_select->execute(array(
                ':bookletId' => $bookletDbId
                ))) {

                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                if ($bookletdata !== false) {
                    $myreturn = json_decode($bookletdata['laststate'], true);
                    if ($bookletdata['locked'] === 't') {
                        $myreturn['locked'] = true;
                    }
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getBookletName($bookletDbId) {
        $myreturn = '';
        if ($this->pdoDBhandle != false) {
            $booklet_select = $this->pdoDBhandle->prepare(
                'SELECT booklets.name FROM booklets
                    WHERE booklets.id=:bookletId');
                
            if ($booklet_select->execute(array(
                ':bookletId' => $bookletDbId
                ))) {

                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                if ($bookletdata !== false) {
                    $myreturn =  $bookletdata['name'];
                }
            }
        }
        return $myreturn;
    }
        

    // __________________________
    // check via canWriteBookletData before calling this!
    public function setBookletStatus($bookletDbId, $laststate) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $booklet_update = $this->pdoDBhandle->prepare(
                'UPDATE booklets SET laststate = :laststate WHERE id = :id');
            if ($booklet_update -> execute(array(
                ':laststate' => json_encode($laststate), // not stringified before sending to server
                ':id' => $bookletDbId))) {
                $myreturn = true;
            }
        }
        return $myreturn;
    }

    // __________________________
    public function unlockBooklet($bookletDbId) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $booklet_update = $this->pdoDBhandle->prepare(
                'UPDATE booklets SET locked = "f" WHERE id = :id');
            if ($booklet_update -> execute(array(
                ':id' => $bookletDbId))) {
                $myreturn = true;
            }
        }
        return $myreturn;
    }

    // __________________________
    public function start_session($logintoken, $code, $booklet, $bookletLabel) {
        $myreturn = [];
        if ($this->pdoDBhandle != false) {
            $login_select = $this->pdoDBhandle->prepare(
                'SELECT logins.id FROM logins
                    WHERE logins.token=:token');
                
            if ($login_select->execute(array(
                ':token' => $logintoken
                ))) {

                $logindata = $login_select->fetch(PDO::FETCH_ASSOC);
                if ($logindata !== false) {
                    $persons_select = $this->pdoDBhandle->prepare(
                        'SELECT persons.id FROM persons
                            WHERE persons.login_id=:id and persons.code=:code');
                        
                    if ($persons_select->execute(array(
                        ':id' => $logindata['id'],
                        ':code' => $code
                        ))) {
        
                        $pToken = uniqid('a', true);
                        $laststate_session = ['lastbooklet' => $booklet];
                        $sessiondata = $persons_select->fetch(PDO::FETCH_ASSOC);
                        if ($sessiondata !== false) {
                            // overwrite token
                            $booklet_update = $this->pdoDBhandle->prepare(
                                'UPDATE persons SET valid_until =:valid_until, token=:token, laststate=:laststate WHERE id = :id');
                            if (!$booklet_update -> execute(array(
                                ':valid_until' => date('Y-m-d H:i:s', time() + $this->idletimeSession),
                                ':laststate' => json_encode($laststate_session),
                                ':token' => $pToken,
                                ':id' => $sessiondata['id']))) {
                                $pToken = '';
                            }
                        } else {
                            $booklet_insert = $this->pdoDBhandle->prepare(
                                'INSERT INTO persons (token, code, login_id, valid_until, laststate) 
                                    VALUES(:token, :code, :login_id, :valid_until, :laststate)');
        
                            if (!$booklet_insert->execute(array(
                                ':token' => $pToken,
                                ':code' => $code,
                                ':login_id' => $logindata['id'],
                                ':valid_until' => date('Y-m-d H:i:s', time() + $this->idletimeSession),
                                ':laststate' => json_encode($laststate_session)
                                ))) {
                                    $pToken = '';
                            }
                        }
                    }
                }

                $persons_select = $this->pdoDBhandle->prepare(
                    'SELECT persons.id FROM persons
                        WHERE persons.token=:token');
                    
                if ($persons_select->execute(array(
                    ':token' => $pToken
                    ))) {
    
                    $sessiondata = $persons_select->fetch(PDO::FETCH_ASSOC);
                    if ($sessiondata !== false) {
                        $laststate_booklet = ['u' => 0];
                        $booklet_select = $this->pdoDBhandle->prepare(
                            'SELECT booklets.locked, booklets.id FROM booklets
                                WHERE booklets.person_id=:personId and booklets.name=:bookletname');
                            
                        if ($booklet_select->execute(array(
                            ':personId' => $sessiondata['id'],
                            ':bookletname' => $booklet
                            ))) {
            
                            $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                            if ($bookletdata !== false) {
                                if ($bookletdata['locked'] === 't') {
                                    $pToken = '';
                                } else {
                                    // setting $bookletLabel
                                    $booklet_update = $this->pdoDBhandle->prepare(
                                        'UPDATE booklets SET label = :label WHERE id = :id');
                                    if ($booklet_update -> execute(array(
                                        ':label' => $bookletLabel,
                                        ':id' => $bookletdata['id']))) {
                                        $myreturn['pt'] = $pToken;
                                        $myreturn['b'] = $bookletdata['id'];
                                    }
                                }
                            } else {
                                $booklet_insert = $this->pdoDBhandle->prepare(
                                    'INSERT INTO booklets (person_id, name, laststate, label) 
                                        VALUES(:person_id, :name, :laststate, :label)');
            
                                if ($booklet_insert->execute(array(
                                    ':person_id' => $sessiondata['id'],
                                    ':name' => $booklet,
                                    ':laststate' => json_encode($laststate_booklet),
                                    ':label' => $bookletLabel
                                    ))) {

                                    $booklet_select = $this->pdoDBhandle->prepare(
                                        'SELECT booklets.id FROM booklets
                                            WHERE booklets.person_id=:personId and booklets.name=:bookletname');
                                        
                                    if ($booklet_select->execute(array(
                                        ':personId' => $sessiondata['id'],
                                        ':bookletname' => $booklet
                                        ))) {
                        
                                        $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                                        if ($bookletdata !== false) {
                                            $myreturn['pt'] = $pToken;
                                            $myreturn['b'] = $bookletdata['id'];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return $myreturn;
    }
    
    // __________________________
    public function start_sessionByPersonToken($pToken, $booklet, $bookletLabel) {
        $myreturn = 0;

        $persons_select = $this->pdoDBhandle->prepare(
            'SELECT persons.id FROM persons
                WHERE persons.token=:token');
            
        if ($persons_select->execute(array(
            ':token' => $pToken
            ))) {

            $personsdata = $persons_select->fetch(PDO::FETCH_ASSOC);
            if ($personsdata !== false) {
                $personId = $personsdata['id'];

                $booklet_select = $this->pdoDBhandle->prepare(
                    'SELECT booklets.locked, booklets.id FROM booklets
                        WHERE booklets.person_id=:personId and booklets.name=:bookletname');
                    
                if ($booklet_select->execute(array(
                    ':personId' => $personId,
                    ':bookletname' => $booklet
                    ))) {
    
                    $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                    if ($bookletdata !== false) {
                        if ($bookletdata['locked'] !== 't') {
                            // setting $bookletLabel
                            $booklet_update = $this->pdoDBhandle->prepare(
                                'UPDATE booklets SET label = :label WHERE id = :id');
                            if ($booklet_update -> execute(array(
                                ':label' => $bookletLabel,
                                ':id' => $bookletdata['id']))) {

                                $myreturn = $bookletdata['id'];
                            }
                        }
                    } else {
                        $booklet_insert = $this->pdoDBhandle->prepare(
                            'INSERT INTO booklets (person_id, name, laststate, label) 
                                VALUES(:person_id, :name, :laststate, :label)');
    
                        if ($booklet_insert->execute(array(
                            ':person_id' => $personId,
                            ':name' => $booklet,
                            ':laststate' => json_encode(['u' => 0]),
                            ':label' => $bookletLabel
                            ))) {

                            $booklet_select = $this->pdoDBhandle->prepare(
                                'SELECT booklets.id FROM booklets
                                    WHERE booklets.person_id=:personId and booklets.name=:bookletname');
                                
                            if ($booklet_select->execute(array(
                                ':personId' => $personsdata['id'],
                                ':bookletname' => $booklet
                                ))) {
                
                                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                                if ($bookletdata !== false) {
                                    $myreturn = $bookletdata['id'];
                                }
                            }
                        }
                    }
                }
            }
        }
        return $myreturn;
    }
    
    
    /*
    // __________________________
    public function stop_session($sessiontoken, $mode) {
        // mode: (by testee) 'cancelled', 'intended', (by test-mc) 'killed'
        $myreturn = '';
        if (($this::: != false) and 
                (count($sessiontoken) > 0)) {

            $sessionquery = :::select($this:::, 'sessions', ['token' => $sessiontoken]);
            if (($sessionquery != false) and (count($sessionquery) > 0)) {
                // remove token
                $laststate_booklet = ['lastunit' => '', 'finished' => $mode];
                :::update($this:::, 'sessions', 
                        ['valid_until' => date('Y-m-d H:i:s', time()), 'token' => '', 'laststate' => json_encode($laststate_booklet)],
                        ['id' => $sessionquery[0]['id']]);
            }
        }
        return $myreturn;
    }
    */


    // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
    //  . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

    // __________________________
    public function getUnitStatus($bookletDbId, $unit) {
        $myreturn = [];
        if ($this->pdoDBhandle != false) {
            $unit_select = $this->pdoDBhandle->prepare(
                'SELECT units.laststate FROM units
                    WHERE units.name = :unitname and units.booklet_id = :bookletId');
                
            if ($unit_select->execute(array(
                ':unitname' => $unit,
                ':bookletId' => $bookletDbId
                ))) {
                
                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                if ($unitdata !== false) {
                    $myreturn['restorepoint'] = $unitdata['laststate'];
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    // public function setUnitStatus_laststate($bookletDbId, $unit, $laststate) {
    //     $myreturn = false;
    //     if ($this->pdoDBhandle != false) {
    //         $unit_select = $this->pdoDBhandle->prepare(
    //             'SELECT units.id FROM units
    //                 WHERE units.name=:name and units.booklet_id=:bookletId');
                
    //         if ($unit_select->execute(array(
    //             ':name' => $unit,
    //             ':bookletId' => $bookletDbId
    //             ))) {

    //             $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
    //             if ($unitdata !== false) {
    //                 $unit_update = $this->pdoDBhandle->prepare(
    //                     'UPDATE units SET laststate=:laststate WHERE id = :id');
    //                 if ($unit_update -> execute(array(
    //                     ':laststate' => json_encode($laststate),
    //                     ':id' => $unitdata['id']))) {
    //                     $myreturn = true;
    //                 }
    //             } else {
    //                 $unit_insert = $this->pdoDBhandle->prepare(
    //                     'INSERT INTO units (booklet_id, name, laststate) 
    //                         VALUES(:bookletId, :name, :laststate)');

    //                 if ($unit_insert->execute(array(
    //                     ':bookletId' => $bookletDbId,
    //                     ':name' => $unit,
    //                     ':laststate' => json_encode($laststate)
    //                     ))) {
    //                         $myreturn = true;
    //                 }
    //             }
    //         }
    //     }
    //     return $myreturn;
    // }

    // __________________________
    public function addUnitResponse($bookletDbId, $unit, $responses) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $unit_select = $this->pdoDBhandle->prepare(
                'SELECT units.id FROM units
                    WHERE units.name=:name and units.booklet_id=:bookletId');
                
            if ($unit_select->execute(array(
                ':name' => $unit,
                ':bookletId' => $bookletDbId
                ))) {

                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                if ($unitdata !== false) {
                    $unit_update = $this->pdoDBhandle->prepare(
                        'UPDATE units SET responses=:responses WHERE id = :id');
                    if ($unit_update -> execute(array(
                        ':responses' => $responses,
                        ':id' => $unitdata['id']))) {
                        $myreturn = true;
                    }
                } else {
                    $unit_insert = $this->pdoDBhandle->prepare(
                        'INSERT INTO units (booklet_id, name, responses) 
                            VALUES(:bookletId, :name, :responses)');

                    if ($unit_insert->execute(array(
                        ':bookletId' => $bookletDbId,
                        ':name' => $unit,
                        ':responses' => $responses
                        ))) {
                            $myreturn = true;
                    }
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function addUnitRestorePoint($bookletDbId, $unit, $restorepoint) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $unit_select = $this->pdoDBhandle->prepare(
                'SELECT units.id FROM units
                    WHERE units.name=:name and units.booklet_id=:bookletId');
                
            if ($unit_select->execute(array(
                ':name' => $unit,
                ':bookletId' => $bookletDbId
                ))) {

                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                if ($unitdata !== false) {
                    $unit_update = $this->pdoDBhandle->prepare(
                        'UPDATE units SET laststate=:laststate WHERE id = :id');
                    if ($unit_update -> execute(array(
                        ':laststate' => $restorepoint,
                        ':id' => $unitdata['id']))) {
                        $myreturn = true;
                    }
                } else {
                    $unit_insert = $this->pdoDBhandle->prepare(
                        'INSERT INTO units (booklet_id, name, laststate) 
                            VALUES(:bookletId, :name, :laststate)');

                    if ($unit_insert->execute(array(
                        ':bookletId' => $bookletDbId,
                        ':name' => $unit,
                        ':laststate' => $restorepoint
                        ))) {
                            $myreturn = true;
                    }
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function addUnitLog($bookletDbId, $unit, $log) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $unit_select = $this->pdoDBhandle->prepare(
                'SELECT units.id FROM units
                    WHERE units.name=:name and units.booklet_id=:bookletId');
                
            if ($unit_select->execute(array(
                ':name' => $unit,
                ':bookletId' => $bookletDbId
                ))) {

                $unitDbId = 0;
                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                if ($unitdata === false) {
                    $unit_insert = $this->pdoDBhandle->prepare(
                        'INSERT INTO units (booklet_id, name) 
                            VALUES(:bookletId, :name)');

                    if ($unit_insert->execute(array(
                        ':bookletId' => $bookletDbId,
                        ':name' => $unit
                        ))) {
                        $unit_select = $this->pdoDBhandle->prepare(
                            'SELECT units.id FROM units
                                WHERE units.name=:name and units.booklet_id=:bookletId');
                            
                        if ($unit_select->execute(array(
                            ':name' => $unit,
                            ':bookletId' => $bookletDbId
                            ))) {
            
                            $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                            if ($unitdata !== false) {
                                $unitDbId = $unitdata['id'];
                            }
                        }
                    }
                } else {
                    $unitDbId = $unitdata['id'];
                }
                if ($unitDbId > 0) {
                    $okCount = 0;
                    foreach($log as $logentry) {
                        $unitlog_insert = $this->pdoDBhandle->prepare(
                            'INSERT INTO unitlogs (unit_id, logentry, logtime) 
                                VALUES(:unitId, :logentry, :logtime)');
    
                        if ($unitlog_insert->execute(array(
                            ':unitId' => $unitDbId,
                            ':logentry' => $logentry,
                            ':logtime' => date('Y-m-d H:i:s', time())
                            ))) {
                                $okCount = $okCount + 1;
                        }
                    }
                    if ($okCount === count($log)) {
                        $myreturn = true;
                    }
                }
            }
        }
        return $myreturn;
    }
}

?>